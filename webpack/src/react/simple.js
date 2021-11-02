import React from 'react';
import ReactDOM from 'react-dom';
import Blue from './components/Blue';

class HelloMessage extends React.Component {
  render() {
    return (
      <div>
        Hello {this.props.name}
        <Blue />
      </div>
    );
  }
}

ReactDOM.render(
  <HelloMessage name="Taylor" />,
  document.getElementById('app')
);