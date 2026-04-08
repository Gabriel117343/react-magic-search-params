import React from "react";
import { UserContainer } from "./components/userContainer";
import { SideModal } from "./components/sideModal";
import { OffsetContainer } from "./components/offsetContainer";

// To this example we don't use Prop Drilling or Context API to shre the configuration of the hook, see constants/userParamsPage.tsx

// We use the configuration in the same place where the hook is used
export default function App() {
  
  return (
    <main className="w-full relative">
     <UserContainer />
     <div className='flex justify-center pb-8'>
       <OffsetContainer />
     </div>
     <SideModal />
    </main>
  );
}
