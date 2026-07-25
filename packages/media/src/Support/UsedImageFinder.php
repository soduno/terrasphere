<?php

declare(strict_types=1);

namespace TerraSphere\Media\Support;

use TerraSphere\Core\Models\Page;
use TerraSphere\Media\Models\MediaAsset;

final class UsedImageFinder
{
    /**
     * @var array<string, array{
     *     id: ?int,
     *     deleteUrl: ?string,
     *     url: string,
     *     name: string,
     *     host: string,
     *     mimeType: ?string,
     *     size: ?int,
     *     width: ?int,
     *     height: ?int,
     *     uploaded: bool,
     *     usageCount: int,
     *     updatedAt: ?string,
     *     pages: array<int, array{id: int, title: string, href: string, sources: list<string>}>
     * }>
     */
    private array $images = [];

    /**
     * @return list<array{
     *     id: ?int,
     *     deleteUrl: ?string,
     *     url: string,
     *     name: string,
     *     host: string,
     *     mimeType: ?string,
     *     size: ?int,
     *     width: ?int,
     *     height: ?int,
     *     uploaded: bool,
     *     usageCount: int,
     *     updatedAt: ?string,
     *     pages: list<array{id: int, title: string, href: string, sources: list<string>}>
     * }>
     */
    public function all(): array
    {
        $this->images = [];
        $this->addUploadedAssets();

        Page::query()
            ->select([
                'id',
                'title',
                'content_type',
                'draft_elements',
                'published_elements',
                'field_schema',
                'draft_field_values',
                'published_field_values',
                'updated_at',
            ])
            ->orderBy('title')
            ->each(function (Page $page): void {
                if ($page->content_type === 'wysiwyg') {
                    $this->findInElements($page->draft_elements ?? [], $page, 'Draft');
                    $this->findInElements($page->published_elements ?? [], $page, 'Published');

                    return;
                }

                $fields = $this->fieldsFromRows($page->field_schema ?? []);
                $this->findInFields($fields, $page->draft_field_values ?? [], $page, 'Draft');
                $this->findInFields($fields, $page->published_field_values ?? [], $page, 'Published');
            });

        $images = array_values($this->images);
        usort(
            $images,
            fn (array $left, array $right): int =>
                strcmp($right['updatedAt'] ?? '', $left['updatedAt'] ?? '')
                ?: strcasecmp($left['name'], $right['name'])
        );

        foreach ($images as &$image) {
            $image['pages'] = array_values($image['pages']);
        }

        return $images;
    }

    private function addUploadedAssets(): void
    {
        MediaAsset::query()
            ->latest()
            ->each(function (MediaAsset $asset): void {
                $url = route('terrasphere.media.file', [
                    'asset' => $asset->uuid,
                    'filename' => $asset->filename,
                ], false);

                $this->images[hash('sha256', $url)] = [
                    'id' => (int) $asset->getKey(),
                    'deleteUrl' => route(
                        'terrasphere.admin.media.destroy',
                        ['asset' => $asset->uuid],
                        false
                    ),
                    'url' => $url,
                    'name' => $asset->filename,
                    'host' => 'Media library',
                    'mimeType' => $asset->mime_type,
                    'size' => $asset->size,
                    'width' => $asset->width,
                    'height' => $asset->height,
                    'uploaded' => true,
                    'usageCount' => 0,
                    'updatedAt' => $asset->updated_at?->toISOString(),
                    'pages' => [],
                ];
            });
    }

    /**
     * @param list<mixed> $elements
     */
    private function findInElements(array $elements, Page $page, string $state): void
    {
        foreach ($elements as $element) {
            if (! is_array($element)) {
                continue;
            }

            $properties = is_array($element['properties'] ?? null) ? $element['properties'] : [];
            if (($element['type'] ?? null) === 'image') {
                $this->add($properties['imageUrl'] ?? null, $page, "$state · Image element");
            }

            if (is_string($element['content'] ?? null)) {
                $this->findInHtml($element['content'], $page, "$state · Rich text");
            }

            if (is_array($element['children'] ?? null)) {
                $this->findInElements($element['children'], $page, $state);
            }
        }
    }

    private function findInHtml(string $html, Page $page, string $source): void
    {
        preg_match_all(
            '/<img\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+))/i',
            $html,
            $matches,
            PREG_SET_ORDER
        );

        foreach ($matches as $match) {
            $this->add($match[1] ?: ($match[2] ?: ($match[3] ?? null)), $page, $source);
        }
    }

    /**
     * @param list<array<string, mixed>> $rows
     * @return list<array<string, mixed>>
     */
    private function fieldsFromRows(array $rows): array
    {
        $fields = [];

        foreach ($rows as $row) {
            if (! is_array($row)) {
                continue;
            }

            foreach (($row['fields'] ?? []) as $field) {
                if (is_array($field)) {
                    $fields[] = $field;
                }
            }
        }

        return $fields;
    }

    /**
     * @param list<array<string, mixed>> $fields
     * @param array<string, mixed> $values
     */
    private function findInFields(array $fields, array $values, Page $page, string $state): void
    {
        foreach ($fields as $field) {
            $name = $field['name'] ?? null;
            $type = $field['type'] ?? null;
            if (! is_string($name) || ! array_key_exists($name, $values)) {
                continue;
            }

            $label = is_string($field['label'] ?? null) ? $field['label'] : $name;
            $value = $values[$name];

            if ($type === 'image') {
                $this->add($value, $page, "$state · $label");
            } elseif ($type === 'image-gallery' && is_array($value)) {
                foreach ($value as $url) {
                    $this->add($url, $page, "$state · $label");
                }
            } elseif ($type === 'repeater' && is_array($value)) {
                $repeaterFields = is_array($field['repeaterFields'] ?? null)
                    ? $field['repeaterFields']
                    : [];

                foreach ($value as $item) {
                    if (is_array($item)) {
                        $this->findInFields($repeaterFields, $item, $page, "$state · $label");
                    }
                }
            }
        }
    }

    private function add(mixed $value, Page $page, string $source): void
    {
        if (! is_string($value)) {
            return;
        }

        $url = trim(html_entity_decode($value, ENT_QUOTES | ENT_HTML5));
        if ($url === '' || preg_match('/^(?:javascript|vbscript):/i', $url) === 1) {
            return;
        }

        $key = hash('sha256', $url);
        $pageId = (int) $page->getKey();

        if (! isset($this->images[$key])) {
            $path = parse_url($url, PHP_URL_PATH);
            $filename = is_string($path) ? urldecode(basename($path)) : '';

            $this->images[$key] = [
                'id' => null,
                'deleteUrl' => null,
                'url' => $url,
                'name' => $filename !== '' ? $filename : 'Image',
                'host' => $this->host($url),
                'mimeType' => null,
                'size' => null,
                'width' => null,
                'height' => null,
                'uploaded' => false,
                'usageCount' => 0,
                'updatedAt' => $page->updated_at?->toISOString(),
                'pages' => [],
            ];
        }

        $this->images[$key]['usageCount']++;
        if (($page->updated_at?->toISOString() ?? '') > ($this->images[$key]['updatedAt'] ?? '')) {
            $this->images[$key]['updatedAt'] = $page->updated_at?->toISOString();
        }

        $editPath = $page->content_type === 'wysiwyg' ? 'editor' : 'fields-editor';
        $this->images[$key]['pages'][$pageId] ??= [
            'id' => $pageId,
            'title' => $page->title,
            'href' => "/admin/$editPath/$pageId",
            'sources' => [],
        ];

        if (! in_array($source, $this->images[$key]['pages'][$pageId]['sources'], true)) {
            $this->images[$key]['pages'][$pageId]['sources'][] = $source;
        }
    }

    private function host(string $url): string
    {
        if (str_starts_with($url, 'data:image/')) {
            return 'Embedded image';
        }

        $host = parse_url($url, PHP_URL_HOST);

        return is_string($host) && $host !== '' ? $host : 'Local file';
    }
}
