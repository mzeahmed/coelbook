// Syntax highlighting for snippets. Only the core of highlight.js and the
// languages below are bundled (the full build is ~1 MB); a snippet in any
// other language is shown as plain text.
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import go from 'highlight.js/lib/languages/go'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import nginx from 'highlight.js/lib/languages/nginx'
import php from 'highlight.js/lib/languages/php'
import plaintext from 'highlight.js/lib/languages/plaintext'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import yaml from 'highlight.js/lib/languages/yaml'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('dockerfile', dockerfile)
hljs.registerLanguage('go', go)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('nginx', nginx)
hljs.registerLanguage('php', php)
hljs.registerLanguage('plaintext', plaintext)
hljs.registerLanguage('python', python)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('yaml', yaml)

// Names people type in the snippet's language field that highlight.js
// doesn't know by default.
hljs.registerAliases(['shell', 'zsh', 'console', 'terminal'], { languageName: 'bash' })
hljs.registerAliases(['text', 'txt'], { languageName: 'plaintext' })
hljs.registerAliases(['docker', 'docker-compose'], { languageName: 'dockerfile' })
hljs.registerAliases(['postgres', 'postgresql', 'mysql'], { languageName: 'sql' })

// highlight returns the snippet as HTML with highlight.js token spans, or
// null when language isn't supported (the caller then renders plain text).
// highlight.js escapes the code itself, so the result is safe to inject.
export function highlight(code: string, language: string): string | null {
  const lang = language.trim().toLowerCase()

  if (!lang || !hljs.getLanguage(lang)) return null

  return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
}
