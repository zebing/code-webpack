import React from 'react';
import './style.scss';
import { Link  } from "react-router-dom";
const styles = {}

export const test = 'test';
export default class Tab extends React.Component {
  constructor (props) {
    super(props);
    // this.history = useHistory();
  }

  push (url) {
    // this.history.push(url);
    const location = {
      pathname: url,
      state: { fromDashboard: true }
    }
    
    history.push(location)
  }

  render () {
    console.log(this.props)
    return (
      <div className={styles.Tab}>
        
        <div className={styles.item}>
          <Link to="/react/red">red</Link>
        </div>
        <div className={styles.item}>
          <Link to="/react/blue">blue</Link>
        </div>
      </div>
    );
  }
}