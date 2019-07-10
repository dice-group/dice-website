import React from 'react';
import Layout from '../components/layout';
import SEO from '../components/seo';

export default function Template({
  data, // this prop will be injected by the GraphQL query below.
}) {
  const { rdf } = data; // data.markdownRemark holds our post data
  const {
    data: { foaf_name, foaf_familyName },
  } = rdf;
  return (
    <Layout>
      <SEO title={`${foaf_name} ${foaf_familyName}`} />
      <div>
        <h1>
          {foaf_name} {foaf_familyName}
        </h1>
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query($path: String!) {
    rdf(path: { eq: $path }) {
      data {
        foaf_name
        foaf_familyName
      }
    }
  }
`;
