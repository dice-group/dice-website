import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import React from 'react';
import Image from '../components/image';
import Layout from '../components/layout';
import SEO from '../components/seo';

const goBack = e => {
  e.preventDefault();
  window.history.back();
};

export default function NewsTemplate({
  data: {
    mdx: { frontmatter, body },
  },
}) {
  return (
    <Layout>
      <SEO title={frontmatter.title} />
      <div className="content" style={{ marginBottom: 260 }}>
        <a href="#" onClick={goBack}>
          ← Go back
        </a>

        <h1 className="title">{frontmatter.title}</h1>

        <p className="has-text-grey" title={frontmatter.fullDate}>
          {frontmatter.date}
        </p>

        {frontmatter.thumbnail ? (
          <div className="news-thumbnail">
            <Image filename={frontmatter.thumbnail} />
          </div>
        ) : (
          ''
        )}
        <MDXRenderer>{body}</MDXRenderer>
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query($path: String!) {
    mdx(fields: { path: { eq: $path } }) {
      frontmatter {
        title
        fullDate: date
        date(fromNow: true)
        thumbnail
      }
      body
    }
  }
`;
