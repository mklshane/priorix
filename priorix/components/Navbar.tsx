import React from 'react'

const Navbar = () => {
  return (
    <div className="w-full flex justify-between items-center px-10 py-5 ">
      <p className="text-2xl font-lora">Priorix</p>
      <div className="flex gap-8 border-2 rounded-4xl px-10 py-2 bg-course-khaki ">
        <a href="">Features</a>
        <a href="">Pricing</a>
        <a href="">Docs</a>
        <a href="">Contact</a> 
      </div>
      <button className="bg-course-pink px-5 py-2 rounded-4xl text-sm border-2 text-secondary-foreground font-semibold font-sora hover:bg-primary-foreground">
        Log In
      </button>
    </div>
  );
}

export default Navbar