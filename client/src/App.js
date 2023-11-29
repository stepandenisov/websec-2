import React from 'react';
import { Staff } from './components/Staff/Staff';
import './App.css'


class App extends React.Component {
	
  constructor(props) {
    super(props);
    this.state = {id: 0};
  }

  increment(){
    this.setState({value: this.state.value + 1});
  }


  render(){
    return (
      <div class="container">
        <Staff />
      </div>
    );
  }
}


export default App;
