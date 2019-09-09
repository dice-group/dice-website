import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import React from 'react';
import BackButton from '../components/backButton';
import Layout from '../components/layout';
import Person from '../components/person/dynamic';
import SEO from '../components/seo';

export default function ThesisTemplate({
  data: {
    mdx: { frontmatter, body },
  },
}) {
  return (
    <Layout>
      <SEO title={frontmatter.title} />
      <div className="content thesis-page">
        <BackButton />
        <h1 className="title">{frontmatter.title}</h1>
        <div className="type">{frontmatter.type} Thesis</div>

        <MDXRenderer>{body}</MDXRenderer>

        <div className="columns contact-info">
          <div className="column">
            <h6>Supervisor</h6>
            <Person id={frontmatter.supervisor} />
          </div>
          <div className="column">
            <h6>Contact</h6>
            <Person id={frontmatter.contact} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query($path: String!) {
    mdx(fields: { path: { eq: $path } }) {
      frontmatter {
        title
        supervisor
        contact
        type
      }
      body
    }
  }
`;
