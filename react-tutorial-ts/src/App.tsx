import { useState } from 'react'
import './App.css'
import MyButton from './MyButton'
import Profile from './Profile'
import ShoppingList from './ShoppingList'
import Square from './game/Square'

function App() {
  function countHandler() {
      setCount(count + 1)
  }
    
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>Welcome My App !</h1>
      <Square />
      
      {/* <MyButton count={count} onClick={countHandler} />
      <MyButton count={count} on={countHandler} />
      <Profile />
      <ShoppingList /> */}
    </div>
  )
}

export default App
