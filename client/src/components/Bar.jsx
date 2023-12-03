import axios from 'axios'
import { useEffect, useState } from 'react'
import React from 'react';
import './Component.css'


export function Bar(){
    return (
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
            <ul class="navbar-nav">
                <li class="nav-item-active">
                    <a class="navbar-brand" href="/staff">Преподаватель</a>
                </li>
                <li class="nav-item-active">
                    <a class="navbar-brand" href="/groups">Группа</a>
                </li>
            </ul>
        </nav>
      )
}


export class BarClass extends React.Component {
    render(){
      return (
          <div class="container">
            <Bar />
          </div>
      );
    }
  }