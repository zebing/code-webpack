import React from 'react';
import ReactDOM from 'react-dom';
import Tab from './components/Tab';
import Red from './components/Red';
import Blue from './components/Blue';

import { HashRouter as Router, Route, Redirect } from "react-router-dom";

class HelloMessage extends React.Component {
  render() {
    return (
      <div>
        Hello {this.props.name}
        <Router>
          <Tab />
          <Route path="/react/red" component={Red} />
          <Route path="/react/blue" component={Blue} />
          <Redirect to="/react/red" />
        </Router>
      </div>
    );
  }
}

ReactDOM.render(
  <HelloMessage name="Taylor" />,
  document.getElementById('app')
);