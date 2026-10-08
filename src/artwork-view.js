import * as THREE from 'three';
export function createArtwork(scene,group){
 const geometry=new THREE.BoxGeometry(1,1,1);const material=new THREE.MeshStandardMaterial({color:0x53bde5,roughness:0.4});const cube=new THREE.Mesh(geometry,material);group.add(cube);
 const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:0xe4fbff}));cube.add(edges);
 scene.add(new THREE.HemisphereLight(0xffffff,0x59677b,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(1,2,3);scene.add(light);
 return {update({size,x,y,angle}){cube.scale.setScalar(size);cube.position.set(x,y,size/2);cube.rotation.set(0,0,angle*Math.PI/180);},dispose(){geometry.dispose();material.dispose();edges.geometry.dispose();edges.material.dispose();}};
}
