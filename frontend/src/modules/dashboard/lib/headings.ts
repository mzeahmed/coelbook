import type { Heading, Root } from 'mdast'
import { toString } from 'mdast-util-to-string'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import { slugify } from './slug'

export interface MarkdownHeading {
  id: string
  text: string
  depth: Heading['depth']
}

// assignHeadingIds gives every heading of a Markdown tree a stable id,
// "<prefix>-<slug of its text>" (suffixed -2, -3… when two headings share
// a text), stores it on the node so it ends up on the rendered <hN>, and
// returns the headings in document order.
//
// It is the single place ids are computed: the Markdown component runs it
// as a remark plugin while rendering, and markdownHeadings runs it on the
// same source to build a table of contents — so links always match.
export function assignHeadingIds(tree: Root, prefix: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = []
  const seen = new Map<string, number>()

  // Headings are block nodes, so only containers can hold them; the walk
  // never needs to look inside paragraphs or other leaves.
  const walk = (node: Root | Root['children'][number]) => {
    if (node.type === 'heading') {
      const text = toString(node).trim()
      const base = `${prefix}-${slugify(text) || 'titre'}`
      const n = (seen.get(base) ?? 0) + 1
      seen.set(base, n)

      const id = n === 1 ? base : `${base}-${n}`
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } }
      headings.push({ id, text, depth: node.depth })

      return
    }

    if ('children' in node) {
      for (const child of node.children) walk(child as Root['children'][number])
    }
  }

  walk(tree)

  return headings
}

// remarkHeadingIds is the remark plugin form of assignHeadingIds.
export function remarkHeadingIds(prefix: string) {
  return () => (tree: Root) => {
    assignHeadingIds(tree, prefix)
  }
}

const parser = unified().use(remarkParse).use(remarkGfm)

// markdownHeadings lists the headings of a Markdown source with the ids the
// Markdown component gives them when rendered with the same prefix.
export function markdownHeadings(markdown: string, prefix: string): MarkdownHeading[] {
  return assignHeadingIds(parser.parse(markdown), prefix)
}
