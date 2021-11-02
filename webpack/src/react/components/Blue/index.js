import React from 'react';
import styles from './styles.module.scss';

export default class Red extends React.Component {
  constructor(props) {
    super(props);
  }

  render () {
    return (
      <div className={styles.Blue}>
        Blue content
      </div>
    );
  }
}