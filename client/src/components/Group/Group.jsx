import axios from 'axios'
import { useEffect, useState } from 'react'
import React from 'react';
import '../Component.css'
import { BarClass } from '../Bar';


export function Group(){
    const [groups, setGroups] = useState([])
    useEffect(() => {
      axios.get('http://localhost:3001/groups/').then((response)=>{
        setGroups(response.data)})
    }, [])

    function searchGroups(groupNumber){
      const request = parseInt(groupNumber)
      if(!isNaN(request)){
        axios.get(`http://localhost:3001/search/${request}`).then((response)=>{
            setGroups(response.data["groups"])})
      }
      else{
        axios.get('http://localhost:3001/groups/').then((response)=>{
            setGroups(response.data)})
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
                    searchGroups(event.target.value)
                  }}
                />
          </div>
          <div class="scrollStaff">
            <div class="list-group" aria-current="true">
              {
                groups.map((group) => {
                  //return <button type="button" class="list-group-item list-group-item-action">{group.number}</button>
                  return <a href={`\\groups\\${group.id}`} class="btn btn-link btn-lg active" role="button" aria-pressed="true">{group.number}</a>
                })
              }
            </div>
          </div>
        </div>
      </div>
      </>
    );
}


export class Groups extends React.Component {
  render(){
    return (
        <div class="container">
          <Group />
        </div>
    );
  }
}
