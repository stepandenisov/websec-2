import React from 'react';
import { Staff } from './components/Staff/Staff';
import { Groups } from './components/Group/Group';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';import './App.css'
import {GroupSchedule} from './components/Group/GroupSchedule'
import { StaffSchedule } from './components/Staff/StaffSchedule';


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
      <div>
        <div>
          <Router>
            <div>
              <Routes>
                <Route exact path="/" element={<Staff />}  />
                <Route exact path="/staff" element={<Staff />} />
                <Route exact path="/groups" element={<Groups />} />
                <Route exact path="/groups/:id" element={<GroupSchedule />}/>
                <Route exact path="/staff/:id" element={<StaffSchedule />}/>
              </Routes>
            </div>
          </Router>
        </div>
        {/* <div class="container">
          <Groups />
        </div> */}
      </div>
    );
  }
}


export default App;
