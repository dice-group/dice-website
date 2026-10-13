import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function MathFormula({ value, displayMode = false }) {
  const Element = displayMode ? 'div' : 'span';
  // Only KaTeX-generated markup is inserted here, never the raw answer HTML.
  const html = katex.renderToString(value, {
    displayMode,
    throwOnError: false,
    trust: false,
    output: 'htmlAndMathml',
  });

  return <Element dangerouslySetInnerHTML={{ __html: html }} />;
}

const renderers = {
  inlineMath: MathFormula,
  math: ({ value }) => <MathFormula value={value} displayMode />,
};

export default function RagAnswer({ answer }) {
  // Evidence is shown in source cards; hide labels the model may still emit.
  const answerText = answer.replace(
    /[ \t]*\[SOURCES?\s+\d+(?:\s*[,;]\s*(?:SOURCES?\s+)?\d+)*\]/gi,
    ''
  );

  return (
    <ReactMarkdown
      className="rag-search-answer"
      source={answerText}
      plugins={[remarkMath]}
      renderers={renderers}
      skipHtml
    />
  );
}
