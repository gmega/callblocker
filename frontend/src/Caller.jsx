import {Avatar, ListItem, ListItemAvatar, ListItemText, Typography} from "@material-ui/core";
import Checkbox from "@material-ui/core/Checkbox";
import {Block, Phone} from "@material-ui/icons";
import {formatTime} from "./helpers";
import PropTypes from "prop-types";
import React from "react";
import moment from 'moment';

function Caller(props) {

    function handleEdit() {
        props.onEdit(props);
    }

    function handleEdit() {
        props.onDelete(props);
    }

    function handleSelectionToggle(source, toggleState) {
        props.onSelect(props, toggleState);
    }

    return (
        <ListItem key={props.fullNumber}>
            <Checkbox
                edge="start"
                tabIndex={-1}
                disableRipple
                onChange={handleSelectionToggle}
                name={props.fullNumber}
            />
            <ListItemAvatar>
                <Avatar>
                    {props.block ? <Block/> : <Phone/>}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={`(${props.areaCode}) ${props.number}`}
                secondary={
                    `${props.description ? props.description : 'Unknown Caller'} - ${props.calls} calls`
                }
            />
            <Typography variant="caption" color="textSecondary">
                {formatTime(moment(props.lastCall))}
            </Typography>
        </ListItem>
    )
}

Caller.propTypes = {
    fullNumber: PropTypes.string.isRequired,
    block: PropTypes.bool.isRequired,
    lastCall: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    onSelect: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func
};

Caller.defaultProps = {
    onToggle: (source, toggleState) => null,
    onEdit: (props) => null,
    onDelete: (props) => null
};

export default Caller;