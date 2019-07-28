// @flow

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {makeStyles} from '@material-ui/core/styles';
import React, {Component} from 'react';

const useStyles = makeStyles(theme => ({
  root: {
    maxWidth: 360
  },
}));

type State = {
  anchorEl: MenuItem,
  selectedIndex: number
};

type Props = {
  options: Array<string>,
  initial: number,
  onChange: (index: number) => void
};

export default class SimpleListMenu extends Component<Props, State> {

  static defaultProps = {
    onChange: (index: number) => undefined,
    initial: 0
  };

  classes = useStyles;

  state = {
    anchorEl: null,
    selectedIndex: this.props.initial
  };

  handleMenuClick = (event: Object) => {
    this.setState({
      ...this.state,
      anchorEl: event.currentTarget
    })
  };

  handleMenuItemClick = (event: Object, index: number) => {
    this.setState({
      selectedIndex: index,
      anchorEl: null
    });

    this.props.onChange(index);
  };

  handleClose = () => {
    this.setState({
      ...this.state,
      anchorEl: null
    })
  };

  render() {
    return (
      <div className={this.classes.root}>
        <List component='nav' aria-label='Ordering'>
          <ListItem
            button
            aria-haspopup='true'
            aria-controls='lock-menu'
            aria-label='Show first'
            onClick={this.handleMenuClick}
            style={{padding: 0}}
          >
            <ListItemText primary='Show first' secondary={this.props.options[this.state.selectedIndex]}/>
          </ListItem>
        </List>
        <Menu
          id='lock-menu'
          anchorEl={this.state.anchorEl}
          keepMounted
          open={Boolean(this.state.anchorEl)}
          onClose={this.handleClose}>{
          this.props.options.map((option, index) => (
            <MenuItem
              key={option}
              selected={index === this.state.selectedIndex}
              onClick={event => this.handleMenuItemClick(event, index)}
            >
              {option}
            </MenuItem>
          ))}
        </Menu>
      </div>
    );
  };
}

