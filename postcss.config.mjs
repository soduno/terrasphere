import tailwindcss from '@tailwindcss/postcss'

const scssTailwindImports = {
    postcssPlugin: 'scss-tailwind-imports',
    Once(root) {
        root.walkAtRules('tailwind-import', (rule) => {
            rule.name = 'import'
        })
    },
}

export default {
    plugins: [scssTailwindImports, tailwindcss()],
}
