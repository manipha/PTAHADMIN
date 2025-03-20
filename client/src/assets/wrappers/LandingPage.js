import styled from "styled-components";

const Wrapper = styled.section`
  nav {
    width: var(--fluid-width);
    max-width: var(--max-width);
    margin: 0 auto;
    height: var(--nav-height);
    display: flex;
    align-items: center;
    z-index: 1000;
    position: sticky;
    top: 0;
  }

  .page {
    min-height: calc(100vh - var(--nav-height));
    display: grid;
    align-items: center;
    margin-top: -2rem;
    text-align: center;
  }

  h1 {
    font-weight: 700;
    span {
      color: rgb(100, 196, 255);
    }
    margin-bottom: 1rem;
    font-size: 2rem;
  }

  h5 {
    margin-bottom: 20px;
    line-height: 1.6;
    color: #535353;
    font-size: 1.2rem;
  }

  p {
    line-height: 1.6;
    color: var(--text-secondary-color);
    margin-bottom: 1rem;
    max-width: 90%;
    margin: 0 auto;
  }

  .register-link {
    margin-right: 0.5rem;
  }

  .main-img {
    display: none;
  }

  .btn {
    padding: 0.8rem 1rem;
    width: 60%;
    max-width: 250px;
    text-align: center;
    background-color: rgb(100, 196, 255);
    font-size: 1rem;
    border-radius: 8px;
  }

  .btn:hover {
    background-color: rgb(149, 214, 255);
    color: aliceblue;
  }

  /* 📱 Mobile (< 768px) */
  @media (max-width: 768px) {
    .page {
      margin-top: 0px;
    }
    h1 {
      font-size: 1.8rem;
    }
    h5 {
      font-size: 1rem;
    }
    p {
      font-size: 0.9rem;
    }
    .info h5 {
      font-size: 13px; 
    }
    .info h1 {
      font-size: 40px; 
    }
    .btn {
      width: 30%;
      font-size: 0.9rem;
    }
      .main-img {
      display: block;
      width: 80%;
      height: 65%;
      max-width: 300px;
      margin: 0 auto;
      margin-top: -200px;
    }
  }

  /* 📲 iPad (768px - 1024px) */
  @media (min-width: 768px) and (max-width: 1024px) {
    .page {
      grid-template-columns: 1fr 1fr;
      column-gap: 2rem;
      text-align: left;
    }
    h1 {
      font-size: 2.5rem;
    }
    h5 {
      font-size: 1.2rem;
    }
    p {
      font-size: 1rem;
    }
    .btn {
      width: 50%;
      font-size: 1rem;
    }
    .main-img {
      display: block;
      width: 80%;
      max-width: 300px;
      margin: 0 auto;
    }
  }

  /* 🖥️ Desktop (≥ 1024px) */
  @media (min-width: 1024px) {
    .page {
      grid-template-columns: 1fr 500px;
      column-gap: 3rem;
      text-align: left;
    }
    .main-img {
      display: block;
      width: 100%;
      height: 400px;
    }
    .btn {
      width: 180px;
    }
    .info h5 {
      font-size: 20px; 
      width: 600px;
    }
    .info h1 {
      font-size: 70px; 
    }
  }
`;

export default Wrapper;
