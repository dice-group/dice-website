import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import React from 'react';
import BackButton from '../components/backButton';
import Layout from '../components/layout';
import SEO from '../components/seo';
import UKFlag from '../components/svgs/ukflag.inline.svg';
import DEFlag from '../components/svgs/deflag.inline.svg';

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
        <h1 className="header">{frontmatter.title}</h1>
        <div>
          {frontmatter.type}{' '}
          <span className="text-gray-500">{frontmatter.kind}</span>{' '}
          {frontmatter.language === 'en' && (
            <span className="language" title="English language">
              <UKFlag style={{ width: 24, height: 12 }} />
            </span>
          )}
          {frontmatter.language === 'de' && (
            <span className="language" title="German language">
              <DEFlag style={{ width: 24, height: 12 }} />
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
      }
      body
    }
  }
`;
