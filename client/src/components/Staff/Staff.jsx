import axios from 'axios'
import { useEffect, useState } from 'react'
import React from 'react';
import '../Style/Component.css'
import { BarClass } from '../Service/Bar';


function Staffs(){

    const [staff, setStaff] = useState([])
    useEffect(() => {
      axios.get('http://localhost:3001/staff/').then((response)=>{
        setStaff(response.data)})
    }, [])

    function searchStaff(staffName){
      if(staffName.length !== 0){
        const request = staffName[0].toUpperCase() + staffName.slice(1);
        axios.get(`http://localhost:3001/search/${request}`).then((response)=>{
            setStaff(response.data["staff"])})
      }
      else{
        axios.get('http://localhost:3001/staff/').then((response)=>{
            setStaff(response.data)})
      }
    }

    return (
      <div className="container flex overflow-visible">
        <div className="container">
          <BarClass />
        </div>
        <div className="container">
        <div className="col">
          <div className="row-sm">
            <input 
                className="form-control mr-sm-2" 
                type="search" 
                placeholder="..." 
                aria-label="Search"
                onChange = {(event) => 
                  {
                    searchStaff(event.target.value)
                  }}
                />
          </div>
          </div>
          </div>
          <div className="container overflow-auto">
            <div className="list-group" aria-current="true">
              {
                staff.map((person) => {
                  return <a key={person.id} href={`\\staff\\${person.id}`} className="btn btn-link btn-lg active" role="button" aria-pressed="true">{person.name}</a>
                })
              }
            </div>
          </div>
    </div>
  );
}

export class Staff extends React.Component {
  render(){
    return (
        <div className="container">
          <Staffs />
        </div>
    );
  }
}