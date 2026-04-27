import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
  }

  section[id] {
    scroll-margin-top: 5rem;
  }

  body {
    background-color: #F8FAFC;
    color: #1E293B;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6, p {
    margin: 0;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: inherit;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: inherit;
  }

  img {
    display: block;
    max-width: 100%;
  }

  ::selection {
    background: #0066FF;
    color: #FFFFFF;
  }
`;
