import React from 'react';
import Link from 'next/link';
import styles from '../styles/Navbar.module.css';

const Navbar: React.FC = () => {
  return (
    <nav className={`container mx-auto ${styles.navbar}`}>
      <Link href="/" className={styles.logo}>
        CodeX
      </Link>

    </nav>
  );
};

export default Navbar;