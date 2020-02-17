import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import Extension from '../internalPages/ExtensionMain/Extension';
import List from '../internalPages/WebsitesList/List';
import Loading from '../internalPages/Loading/Loading';
import SomethingWentWrong from '../internalPages/Errors/SomethingWentWrong';
import Install from '../internalPages/InstallPage/Install';

const Root: React.FC = () => (
	<Router>
		<Switch>
			<Route path="/install">
				<Install />
			</Route>
      <Route path="/list">
        <List />
      </Route>
			<Route path="/loading">
				<Loading />
			</Route>
			<Route path="/error">
				<SomethingWentWrong />
			</Route>
			<Route>
				<Extension />
			</Route>
		</Switch>
	</Router>
);

export default Root;
