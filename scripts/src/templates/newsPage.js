import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import React from 'react';
import Image from '../components/image';
import Layout from '../components/layout';
import SEO from '../components/seo';

export default function NewsTemplate({
  data: {
    mdx: { frontmatter, body },
  },
}) {
  return (
    <Layout>
      <SEO title={frontmatter.title} />
      <div className="content">
        <h1 className="title">{frontmatter.title}</h1>

        <div class="tags has-addons">
          <span class="tag is-light">Published</span>
          <span class="tag is-dark" title={frontmatter.fullDate}>
            {frontmatter.date}
          </span>
        </div>

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
