import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';
interface VenueModelProps {
  selectedSection: string;
}
export default function VenueModel({ selectedSection }: VenueModelProps) {
  const stageRef = useRef<Mesh>(null); // Ref for the stage mesh
  const seatsRef = useRef<Group>(null); // Ref for the seats group
  // Rotate the stage continuously
  useFrame(() => {
    if (stageRef.current) {
      stageRef.current.rotation.y += 0.002;
    }
  });
  return (
    <group ref={seatsRef}>
      {/* Stage */}
      <mesh ref={stageRef} position={[0, -1, 0]}>
        <cylinderGeometry args={[3, 3, 0.2, 32]} />
        <meshStandardMaterial color="#4f46e5" />
      </mesh>
      {/* Seating Sections */}
      <group position={[0, 0, 0]}>
        {/* VIP Section */}
        <mesh position={[0, -0.5, -2]} scale={[4, 0.1, 1]}>
          <boxGeometry args={[1, 0.1, 1]} />
          <meshStandardMaterial 
            color={selectedSection === 'vip' ? '#4f46e5' : '#9ca3af'} 
          />
        </mesh>
        {/* Premium Section */}
        <mesh position={[0, -0.6, -3.5]} scale={[5, 0.1, 1]}>
          <boxGeometry args={[1, 0.1, 1]} />
          <meshStandardMaterial 
            color={selectedSection === 'premium' ? '#4f46e5' : '#d1d5db'} 
          />
        </mesh>
        {/* Standard Section */}
        <mesh position={[0, -0.7, -5]} scale={[6, 0.1, 1]}>
          <boxGeometry args={[1, 0.1, 1]} />
          <meshStandardMaterial 
            color={selectedSection === 'standard' ? '#4f46e5' : '#e5e7eb'} 
          />
        </mesh>
      </group>
    </group>
  );
}