import React from 'react'
import Navbar from './components/Navbar'
import Tabs from './components/Tabs'
import DataEntry from './components/pages/DataEntry'

const App = () => {
  return (
   <section className=''>
    <Navbar/>
    <div className='pt-24'>
    <Tabs/>
    
    </div>
   </section>
  )
}

export default App