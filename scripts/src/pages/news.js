import React from 'react';
import Layout from '../components/layout';
import News from '../components/news';
import SEO from '../components/seo';

export default function NewsTemplate() {
  return (
    <Layout>
      <SEO title="News" />
      <News />
    </Layout>
  );
}
