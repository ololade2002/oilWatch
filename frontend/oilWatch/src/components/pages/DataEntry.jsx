import React from 'react'
import { cardsData } from '../../utils/Data'
import PostForm from '../PostForm'

const DataEntry = () => {
  return (
    <section className='px-4 py-6 lg:px-6 bg-bgPrimary'>
      <main className='flex flex-col'>
        <div className='cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {cardsData.map((cards) => (
            <div className="cards-preview relative p-4 flex flex-col gap-1 font-rajdhani bg-bgTertiary  uppercase" key={cards.id}>
              <h3 className='text-text2'>{cards.text1}</h3>
              <div className=' font-orbitron tracking-wider flex flex-row items-baseline gap-1  text-text text-2xl font-bold'>
                <p>{cards.value}</p>
                <p className='text-sm font-normal'>{cards.unit}</p>
              </div>
              <p className='text-text2 text-[13px]'>{cards.text2}</p>
              <div className={`absolute top-0 left-0 ${cards.color} h-full w-0.75 `}/>
            </div>
          ))}
        </div>

        <div>
          <PostForm/>
          
        </div>
      </main>
    </section>
  )
}

export default DataEntry