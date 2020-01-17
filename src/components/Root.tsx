import React from 'react'
import {HashRouter as Router, Route, Switch} from 'react-router-dom'
import Install from './Install'
import Options from './Options'

export default () => (
  <Router>
    <Switch>
      <Route path="/install">
        <Install />
        <Options />
      </Route>
      <Route>
        <Options />
      </Route>
    </Switch>
  </Router>
)
