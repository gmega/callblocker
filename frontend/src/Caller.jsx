import {
    Avatar,
    Box,
    Button,
    IconButton,
    ListItem,
    ListItemAvatar,
    ListItemText,
    TextField,
    Tooltip,
    Typography
} from "@material-ui/core";
import {useTheme} from '@material-ui/core/styles';
import Checkbox from "@material-ui/core/Checkbox";
import {Block, Cancel, Delete, Edit, Phone, Save} from "@material-ui/icons";
import {formatTime} from "./helpers";
import PropTypes from "prop-types";
import React from "react";
import moment from 'moment';
import makeStyles from "@material-ui/core/styles/makeStyles";

const useStyles = makeStyles(theme => ({
    editorContainer: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        marginBottom: theme.spacing(2)
    },
    editorContainerInner: {
        display: 'flex',
        alignItems: 'center',
        marginTop: theme.spacing(1),
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3)
    },
    editorTypography: {
        padding: theme.spacing(2)
    },
    editorItems: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1)
    }

}));

export function Caller(props) {

    const [editBarOpen, setEditBarOpen] = React.useState(false);

    function handleEdit() {
        props.onEdit(props);
    }

    function handleDelete() {
        props.onDelete(props);
    }

    function handleSelectionToggle(source, toggleState) {
        props.onSelect(props, toggleState);
    }

    function handleMouseOver() {
        setEditBarOpen(true);
    }

    function handleMouseOut() {
        setEditBarOpen(false);
    }

    return (
        <Box boxShadow={editBarOpen ? 1 : 0} style={{margin: '5px'}}>
            <ListItem key={props.fullNumber} onMouseOver={handleMouseOver} onMouseLeave={handleMouseOut}>
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
                {editBarOpen ?
                    <div>
                        <Tooltip title="Edit">
                            <IconButton aria-label="Edit" onClick={handleEdit}>
                                <Edit/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton aria-label="Delete" onClick={handleDelete}>
                                <Delete/>
                            </IconButton>
                        </Tooltip>
                    </div> :
                    <Typography variant="caption" color="textSecondary">
                        {formatTime(moment(props.lastCall))}
                    </Typography>
                }
            </ListItem>
        </Box>
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
    onSelect: (source, toggleState) => null,
    onEdit: (props) => null,
    onDelete: (props) => null
};

function CallerEditForm(props) {
    const [callerInfo, setCallerInfo] = React.useState({
        description: props.description,
        notes: props.notes
    });
    const classes = useStyles();
    const theme = useTheme();

    const handleChange = fieldId => content => {
        setCallerInfo({
            ...callerInfo,
            [fieldId]: content.target.value
        });
    };

    function handleSaveClicked() {
        props.onSubmit(props.fullNumber, callerInfo.description, callerInfo.notes);
    }

    function handleCancelClicked() {
        props.onCancel(props.fullNumber);
    }

    return (
        <Box className={classes.editorContainer}>
            <Box className={classes.editorContainer} boxShadow={1}>
                <Box className={classes.editorContainerInner}>
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
                </Box>
                <Box className={classes.editorContainer}>
                    <TextField
                        className={classes.editorItems}
                        id="description"
                        label="Description"
                        value={callerInfo.description}
                        onChange={handleChange('description')}
                    />
                    <TextField
                        className={classes.editorItems}
                        id="notes"
                        label="Notes"
                        value={callerInfo.notes}
                        onChange={handleChange('notes')}
                        multiline
                    />
                </Box>
                <Box>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleSaveClicked}
                        className={classes.editorItems}
                        style={{marginLeft: theme.spacing(2)}}
                    >
                        <Save style={{marginRight: theme.spacing(1)}}/>Save
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        className={classes.editorItems}
                        onClick={handleCancelClicked}
                        style={{marginLeft: theme.spacing(2)}}
                    >
                        <Cancel style={{marginRight: theme.spacing(1)}}/>Cancel
                    </Button>
                </Box>

            </Box>
        </Box>
    )
}

CallerEditForm.propTypes = {
    fullNumber: Caller.propTypes.fullNumber,
    block: Caller.propTypes.block,
    lastCall: Caller.propTypes.lastCall,
    description: Caller.propTypes.description,
    notes: PropTypes.string,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func
};

CallerEditForm.defaultProps = {
    description: '',
    notes: '',
    onSubmit: (fullNumber, description, notes) => null,
    onCancel: (fullNumber) => null
};

export function EditableCaller(props) {

    const [editFormOpen, setEditFormOpen] = React.useState(false);

    function handleEditClicked() {
        setEditFormOpen(true);
    }

    function handleFormSubmitted(fullNumber, description, notes) {
        setEditFormOpen(false);
        props.onSubmit(fullNumber, description, notes);
    }

    function handleEditCancelled() {
        setEditFormOpen(false);
    }

    return !editFormOpen ?
        <Caller {...props} onEdit={handleEditClicked} onSelect={props.onSelect}/> :
        <CallerEditForm {...props} onSubmit={handleFormSubmitted} onCancel={handleEditCancelled}/>
}

EditableCaller.propTypes = {
    fullNumber: Caller.propTypes.fullNumber,
    block: Caller.propTypes.block,
    lastCall: Caller.propTypes.lastCall,
    description: Caller.propTypes.description,
    notes: CallerEditForm.propTypes.notes,
    onSelect: Caller.propTypes.onSelect,
    onSubmit: CallerEditForm.propTypes.onSubmit
};

EditableCaller.defaultProps = {
    description: Caller.defaultProps.description,
    notes: CallerEditForm.defaultProps.notes,
    onSelect: Caller.defaultProps.onSelect,
    onSubmit: CallerEditForm.defaultProps.onSubmit
};
