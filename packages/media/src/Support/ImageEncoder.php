<?php

declare(strict_types=1);

namespace TerraSphere\Media\Support;

use GdImage;
use RuntimeException;
use Throwable;

final class ImageEncoder
{
    /**
     * @var array<string, array{label: string, mimeType: string, encoder: string}>
     */
    private const FORMATS = [
        'jpeg' => [
            'label' => 'JPG',
            'mimeType' => 'image/jpeg',
            'encoder' => 'imagejpeg',
        ],
        'png' => [
            'label' => 'PNG',
            'mimeType' => 'image/png',
            'encoder' => 'imagepng',
        ],
        'webp' => [
            'label' => 'WebP',
            'mimeType' => 'image/webp',
            'encoder' => 'imagewebp',
        ],
        'gif' => [
            'label' => 'GIF',
            'mimeType' => 'image/gif',
            'encoder' => 'imagegif',
        ],
        'avif' => [
            'label' => 'AVIF',
            'mimeType' => 'image/avif',
            'encoder' => 'imageavif',
        ],
    ];

    /**
     * @return list<array{value: string, label: string, mimeType: string}>
     */
    public static function supportedFormats(): array
    {
        if (! function_exists('imagecreatefromstring')) {
            return [];
        }

        $formats = [];

        foreach (self::FORMATS as $value => $format) {
            if (! function_exists($format['encoder'])) {
                continue;
            }

            $formats[] = [
                'value' => $value,
                'label' => $format['label'],
                'mimeType' => $format['mimeType'],
            ];
        }

        return $formats;
    }

    public static function mimeType(string $format): string
    {
        return self::FORMATS[$format]['mimeType']
            ?? throw new RuntimeException('The requested image format is not supported.');
    }

    public function encode(string $contents, string $format): string
    {
        $definition = self::FORMATS[$format] ?? null;
        if (
            $definition === null
            || ! function_exists($definition['encoder'])
            || ! function_exists('imagecreatefromstring')
        ) {
            throw new RuntimeException('The requested image format is not supported.');
        }

        $previousMemoryLimit = null;
        if ($format === 'gif') {
            $dimensions = @getimagesizefromstring($contents);
            if (
                ! is_array($dimensions)
                || ($dimensions[0] * $dimensions[1]) > 40_000_000
            ) {
                throw new RuntimeException(
                    'The image is too large to convert safely to GIF.'
                );
            }

            $previousMemoryLimit = ini_get('memory_limit');
            ini_set('memory_limit', '384M');
        }

        $image = @imagecreatefromstring($contents);
        if (! $image instanceof GdImage) {
            if (is_string($previousMemoryLimit)) {
                ini_set('memory_limit', $previousMemoryLimit);
            }

            throw new RuntimeException('The edited image could not be decoded.');
        }

        $bufferLevel = ob_get_level();

        try {
            if ($format === 'jpeg') {
                $image = $this->flattenTransparency($image);
            } else {
                imagealphablending($image, false);
                imagesavealpha($image, true);
            }

            ob_start();

            $encoded = match ($format) {
                'jpeg' => imagejpeg($image, null, 92),
                'png' => imagepng($image, null, 6),
                'webp' => imagewebp($image, null, 90),
                'gif' => imagegif($image),
                'avif' => imageavif($image, null, 80),
                default => false,
            };
            $result = ob_get_clean();
        } catch (Throwable $exception) {
            while (ob_get_level() > $bufferLevel) {
                ob_end_clean();
            }

            throw $exception;
        } finally {
            unset($image);

            if (is_string($previousMemoryLimit)) {
                ini_set('memory_limit', $previousMemoryLimit);
            }
        }

        if (! $encoded || ! is_string($result)) {
            throw new RuntimeException('The edited image could not be encoded.');
        }

        return $result;
    }

    private function flattenTransparency(GdImage $source): GdImage
    {
        $image = imagecreatetruecolor(imagesx($source), imagesy($source));
        imagefill($image, 0, 0, imagecolorallocate($image, 255, 255, 255));
        imagealphablending($image, true);
        imagecopy(
            $image,
            $source,
            0,
            0,
            0,
            0,
            imagesx($source),
            imagesy($source),
        );

        return $image;
    }
}
