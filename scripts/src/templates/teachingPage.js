import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import React from 'react';
import BackButton from '../components/backButton';
import Layout from '../components/layout';
import SEO from '../components/seo';
import UKFlag from '../components/svgs/ukflag.inline.svg';

export default function TeachingTemplate({
  data: {
    mdx: { frontmatter, body },
  },
}) {
  return (
    <Layout>
      <SEO title={frontmatter.title} />
      <div className="content teaching-page">
        <BackButton />
        <h1 className="title">{frontmatter.title}</h1>
        <div>
          {frontmatter.type}{' '}
          <span className="has-text-grey-light">{frontmatter.kind}</span>{' '}
          {frontmatter.language === 'en' && (
            <span title="English language">
              <UKFlag style={{ width: 24, height: 12 }} />
            </span>
          )}
        </div>

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
        type
        year
        term
        kind
        language
        sort: {
          fields: [year]
          order: ASC
        }
      }
      body
    }
  }
`;
