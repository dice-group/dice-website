import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import React from 'react';
import BackButton from '../components/backButton';
import Image from '../components/image';
import Layout from '../components/layout';
import SEO from '../components/seo';
import Person from '../components/person/dynamic';

export default function NewsTemplate({
  data: {
    mdx: { frontmatter, body },
  },
}) {
  return (
    <Layout>
      <SEO title={frontmatter.title} />
      <div className="content" style={{ marginBottom: 160 }}>
        <BackButton />

        <h1 className="title">{frontmatter.title}</h1>

        <p className="text-gray-500">
          <span title={frontmatter.fullDate}>{frontmatter.date}</span> by{' '}
          <Person name={frontmatter.author} className="text-gray-500" />
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
        author
        fullDate: date
        date(fromNow: true)
        thumbnail
      }
      body
    }
  }
`;
