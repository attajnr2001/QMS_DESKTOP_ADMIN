import React, { useState, useEffect } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Chip,
  TextField,
  CircularProgress,
  Menu,
  MenuItem
} from '@mui/material'
import { AccessTime, HourglassEmpty, Close, CalendarToday, Person } from '@mui/icons-material'
import { collection, query, getDocs, where } from 'firebase/firestore'
import { db } from '../helpers/firebase'
import VisitorTable from '../components/VisitorTable'

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const statusOptions = ['waiting', 'serving', 'completed']

const NavItem = ({
  icon: Icon,
  label,
  hasSubmenu,
  isCalendar,
  isStatus,
  isTeller,
  onSelect,
  options
}) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedValue, setSelectedValue] = useState(label)

  const handleClick = (event) => {
    if (hasSubmenu || isCalendar || isStatus || isTeller) {
      setAnchorEl(event.currentTarget)
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (value) => {
    setSelectedValue(value)
    onSelect(value)
    handleClose()
  }

  return (
    <>
      <Chip
        icon={<Icon fontSize="small" />}
        label={selectedValue}
        onClick={handleClick}
        color={hasSubmenu || isCalendar || isStatus || isTeller ? 'primary' : 'default'}
        variant={hasSubmenu || isCalendar || isStatus || isTeller ? 'outlined' : 'filled'}
        sx={{
          m: 0.5,
          p: 0.4,
          '& .MuiChip-label': { fontSize: '0.75rem', padding: '0 6px' },
          '& .MuiChip-icon': { fontSize: '1rem' },
          height: 28
        }}
      />
      {(hasSubmenu || isCalendar || isStatus || isTeller) && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
          {isCalendar && (
            <>
              <MenuItem key="all" onClick={() => handleSelect('This Month')}>
                This Month
              </MenuItem>
              {months.map((month) => (
                <MenuItem key={month} onClick={() => handleSelect(month)}>
                  {month}
                </MenuItem>
              ))}
            </>
          )}
          {isStatus && (
            <>
              <MenuItem key="all" onClick={() => handleSelect('All Statuses')}>
                All Statuses
              </MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status} onClick={() => handleSelect(status)}>
                  {status}
                </MenuItem>
              ))}
            </>
          )}
          {isTeller &&
            options &&
            options.map((option) => (
              <MenuItem key={option} onClick={() => handleSelect(option)}>
                {option}
              </MenuItem>
            ))}
        </Menu>
      )}
    </>
  )
}

const DataInsights = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('This Month')
  const [selectedStatus, setSelectedStatus] = useState('All Statuses')
  const [selectedTeller, setSelectedTeller] = useState('All Tellers')
  const [tellers, setTellers] = useState(['All Tellers'])
  const [searchTerm, setSearchTerm] = useState('')
  const [orderBy, setOrderBy] = useState('beganWaiting')
  const [order, setOrder] = useState('desc')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const queuesRef = collection(db, 'queues')
        const queueSnapshot = await getDocs(queuesRef)

        const tellersSet = new Set(['All Tellers'])

        const queueData = await Promise.all(
          queueSnapshot.docs.map(async (doc) => {
            const data = doc.data()

            // Fetch teller details
            const tellersRef = collection(db, 'tellers')
            const tellerDoc = await getDocs(query(tellersRef, where('__name__', '==', data.teller)))
            const tellerName = tellerDoc.empty ? 'Unknown Teller' : tellerDoc.docs[0].data().name

            tellersSet.add(tellerName)
            // Fetch service details
            const servicesRef = collection(db, 'services')
            const serviceDoc = await getDocs(
              query(servicesRef, where('__name__', '==', data.service))
            )
            const serviceName = serviceDoc.empty
              ? 'Unknown Service'
              : serviceDoc.docs[0].data().service

            return {
              teller: tellerName,
              service: serviceName,
              beganWaiting: formatTimestamp(data.joinedOn),
              waitTime: formatDuration(data.waitingTime),
              serviceTime: formatDuration(data.servingTime),
              timeSpent: formatDuration(data.totalTime), // Add this line
              status: data.state,
              queueCode: data.queueCode,
              beganWaitingDate: data.joinedOn.toDate(),
              waitTimeMinutes: data.waitingTime,
              serviceTimeMinutes: data.servingTime,
              totalTimeMinutes: data.totalTime // Add this line
            }
          })
        )

        setRows(queueData)
        setTellers(Array.from(tellersSet))
      } catch (error) {
        console.error('Error fetching queue data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatTimestamp = (timestamp) => {
    const date = timestamp.toDate()
    return `${date.toLocaleTimeString()}\n${date.toLocaleDateString()}`
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, '0')}`
  }

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const sortedRows = React.useMemo(() => {
    return [...rows].sort((a, b) => {
      if (orderBy === 'beganWaiting') {
        return order === 'asc'
          ? a.beganWaitingDate.getTime() - b.beganWaitingDate.getTime()
          : b.beganWaitingDate.getTime() - a.beganWaitingDate.getTime()
      }
      if (orderBy === 'waitTime') {
        return order === 'asc'
          ? a.waitTimeMinutes - b.waitTimeMinutes
          : b.waitTimeMinutes - a.waitTimeMinutes
      }
      if (orderBy === 'serviceTime') {
        return order === 'asc'
          ? a.serviceTimeMinutes - b.serviceTimeMinutes
          : b.serviceTimeMinutes - a.serviceTimeMinutes
      }
      if (orderBy === 'timeSpent') {
        return order === 'asc'
          ? a.totalTimeMinutes - b.totalTimeMinutes
          : b.totalTimeMinutes - a.totalTimeMinutes
      }
      return 0
    })
  }, [rows, orderBy, order])

  const filteredRows = React.useMemo(() => {
    return sortedRows.filter((row) => {
      const rowMonth = new Date(row.beganWaiting.split('\n')[1]).toLocaleString('default', {
        month: 'long'
      })
      return (
        (selectedMonth === 'This Month' || rowMonth === selectedMonth) &&
        (selectedStatus === 'All Statuses' ||
          row.status.toLowerCase() === selectedStatus.toLowerCase()) &&
        (selectedTeller === 'All Tellers' || row.teller === selectedTeller) &&
        (row.teller.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.service.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })
  }, [sortedRows, selectedMonth, selectedStatus, selectedTeller, searchTerm])

  if (loading) {
    return <CircularProgress />
  }

  return (
    <>
      <AppBar position="static" color="default">
        <Toolbar variant="dense">
          <NavItem
            icon={CalendarToday}
            label={selectedMonth}
            isCalendar
            onSelect={setSelectedMonth}
          />
          <NavItem icon={AccessTime} label={selectedStatus} isStatus onSelect={setSelectedStatus} />
          <NavItem
            icon={Person}
            label={selectedTeller}
            isTeller
            onSelect={setSelectedTeller}
            options={tellers}
          />
          <NavItem icon={HourglassEmpty} label="Wait time" hasSubmenu />
          <NavItem icon={AccessTime} label="Service time" hasSubmenu />
          <IconButton
            edge="end"
            color="inherit"
            aria-label="close"
            sx={{ marginLeft: 'auto' }}
            size="small"
          >
            <Close fontSize="small" />
          </IconButton>
        </Toolbar>
      </AppBar>
      <div style={{ padding: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}
        >
          <Typography variant="h5" gutterBottom fontWeight={'bold'}>
            Data Insight
          </Typography>
          <TextField
            type="text"
            placeholder="Search by Teller, or Service"
            size="small"
            style={{ marginLeft: '8px', padding: '4px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <VisitorTable rows={filteredRows} onSort={handleSort} orderBy={orderBy} order={order} />
      </div>
    </>
  )
}

export default DataInsights
