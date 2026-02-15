import { useState } from "react"

export default function MyButton({count, onClick}) {
    // function clickMe() {
    //     setCount(count + 1)
    // }
    
    // const [count, setCount] = useState(0)

    return (
        <button onClick={onClick}>
            Clicked {count} times !! 
        </button>
    )
}
