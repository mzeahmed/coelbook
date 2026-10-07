import { Fragment } from 'react'

import { HIGHLIGHT_END, HIGHLIGHT_START } from '../api'

// Highlighted renders text from the API's search highlights, turning each
// HIGHLIGHT_START…HIGHLIGHT_END span into a <mark>. The markers are plain
// characters, so the text is rendered as text (never as HTML).
export default function Highlighted({ text }: { text: string }) {
  const parts = text.split(HIGHLIGHT_START)

  return (
    <>
      {parts.map((part, i) => {
        if (i === 0) return <Fragment key={i}>{part}</Fragment>

        const end = part.indexOf(HIGHLIGHT_END)
        if (end === -1) return <Fragment key={i}>{part}</Fragment>

        return (
          <Fragment key={i}>
            <mark className="pb-mark">{part.slice(0, end)}</mark>
            {part.slice(end + HIGHLIGHT_END.length)}
          </Fragment>
        )
      })}
    </>
  )
}
