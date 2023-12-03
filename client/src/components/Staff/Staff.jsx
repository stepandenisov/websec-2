import axios from 'axios'
import { useEffect, useState } from 'react'
import React from 'react';
import '../Component.css'
import { BarClass } from '../Bar';


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
      <>
        <div class="container">
          <BarClass />
        </div>
        <div class="container">
        <div class="col">
          <div class="row-sm">
            <input 
                class="form-control mr-sm-2" 
                type="search" 
                placeholder="..." 
                aria-label="Search"
                onChange = {(event) => 
                  {
                    searchStaff(event.target.value)
                  }}
                />
          </div>
          <div class="scrollStaff">
            <div class="list-group" aria-current="true">
              {
                staff.map((person) => {
                  return <a href={`\\staff\\${person.id}`} class="btn btn-link btn-lg active" role="button" aria-pressed="true">{person.name}</a>
                })
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export class Staff extends React.Component {
  render(){
    return (
        <div class="container">
          <Staffs />
        </div>
    );
  }
}