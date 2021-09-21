import React from 'react';
import styles from './style';

export default class Red extends React.Component {
  constructor(props) {
    super(props);
  }

  render () {
    return (
      <div className={styles.Red}>
        red content
      </div>
    );
  }
}