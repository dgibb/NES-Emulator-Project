/* eslint-disable no-alert */

import React from 'react';
import jquery from 'jquery';
// import { Client } from '../index.html';

const INVALID = 'invalid';
const VALID = 'valid';
const INITIAL = 'initial';

function runFrame() {
  jquery.post('/runFrame', true);
}

export class Info extends React.Component {
  constructor() {
    super();
    this.state = {
      status: 'initial',
    };
    this.playGame = this.playGame.bind(this);
  }

  playGame() {
    const input = document.getElementById('romFileInput');
    const file = input.files[0];
    if (file === undefined) {
      alert('Please Select a File');
      return;
    }
    const reader = new FileReader;
    reader.onload = (e) => {
      const byteArray = new Uint8Array(reader.result);
      console.log(byteArray, byteArray.length);
      xhr.send(byteArray);
    };
    const xhr = new XMLHttpRequest;
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const string = (xhr.responseText === 'true') ? VALID : INVALID;
        console.log('xhr response: ', xhr.responseText);
        this.setState({ status: string });
      }
    };
    xhr.open('POST', '/sendRom', false);
    reader.readAsArrayBuffer(file);
  }

  render() {
    switch (this.state.status) {
      case INITIAL:
        return (
          <div className="outer-container grey col-xs-12">
            <div className="inner-container col-lg-8 col-md-10 col-sm-12 col-xs-12">
              <h2>Choose a Rom File</h2>

              <div className="button-container col-lg-6 col-md-6 col-sm-6 col-xs-6">
                <input type="file" id="romFileInput" name="file[]" />
              </div>
              <div className="button-container col-lg-6 col-md-6 col-sm-6 col-xs-6">
                <button id="load-ROM" onClick={this.playGame} >Play ROM</button>
              </div>
            </div>
          </div>
        );

      case VALID:
        return (
          <div className="outer-container grey col-xs-12">
            <div className="inner-container col-lg-8 col-md-10 col-sm-12 col-xs-12">
              <h2>Click to Run a Frame</h2>
              <div className="button-container col-xs-offset-3 col-lg-6 col-md-6 col-sm-6 col-xs-6">
                <button id="load-ROM" onClick={runFrame} >Run Frame</button>
              </div>
            </div>
          </div>
        );

      case INVALID:
        return (
          <div className="outer-container grey col-xs-12">
            <div className="inner-container col-lg-8 col-md-10 col-sm-12 col-xs-12">
              <h2>Choose a Rom File</h2><br />
              <p>File Invalid: Please Try another File</p>

              <div className="button-container col-lg-6 col-md-6 col-sm-6 col-xs-6">
                <input type="file" id="romFileInput" name="file[]" />
              </div>
              <div className="button-container col-lg-6 col-md-6 col-sm-6 col-xs-6">
                <button id="load-ROM" onClick={this.playGame} >Play ROM</button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="outer-container grey col-xs-12">
            <div className="inner-container col-lg-8 col-md-10 col-sm-12 col-xs-12">
              <h2>There was an error</h2><br />
              <p>please refresh the page</p>
            </div>
          </div>
        );
    }
  }
}
