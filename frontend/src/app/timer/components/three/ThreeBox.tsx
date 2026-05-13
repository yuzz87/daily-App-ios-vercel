"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export default function ThreeBox() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf3f3f3)

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    )

    camera.position.set(0, 5, 20)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    renderer.domElement.style.display = "block"
    renderer.domElement.style.width = "100%"
    renderer.domElement.style.height = "100%"

    container.appendChild(renderer.domElement)

    const magicCircle = new THREE.Group()
    magicCircle.position.y = -1.5
    magicCircle.rotation.x = -Math.PI / 2
    magicCircle.scale.setScalar(1.3)

    scene.add(magicCircle)

    const baseColor = new THREE.Color(0xd65cff)

    const lineMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.8,
    })

    const faintMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.35,
    })

    const createTubeLine = (
      points: THREE.Vector3[],
      material: THREE.MeshBasicMaterial,
      radius = 0.025,
      closed = false,
    ) => {
      const curve = new THREE.CatmullRomCurve3(points, closed)

      const geometry = new THREE.TubeGeometry(
        curve,
        160,
        radius,
        8,
        closed,
      )

      return new THREE.Mesh(geometry, material)
    }

    const createCircleLine = (
      radius: number,
      material: THREE.MeshBasicMaterial,
      tubeRadius = 0.025,
      segments = 256,
    ) => {
      const points: THREE.Vector3[] = []

      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2

        points.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0,
          ),
        )
      }

      return createTubeLine(points, material, tubeRadius, true)
    }

    const createPolygonLine = (
      radius: number,
      sides: number,
      material: THREE.MeshBasicMaterial,
      tubeRadius = 0.025,
    ) => {
      const points: THREE.Vector3[] = []

      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2

        points.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0,
          ),
        )
      }

      return createTubeLine(points, material, tubeRadius, true)
    }

    const createRadialLines = (
      radius: number,
      count: number,
      material: THREE.MeshBasicMaterial,
      tubeRadius = 0.018,
    ) => {
      const group = new THREE.Group()

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2

        const points = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0,
          ),
        ]

        const line = createTubeLine(points, material, tubeRadius, false)
        group.add(line)
      }

      return group
    }

    magicCircle.add(createCircleLine(5, lineMaterial, 0.04))
    magicCircle.add(createCircleLine(4.2, faintMaterial, 0.026))
    magicCircle.add(createCircleLine(3.2, faintMaterial, 0.026))
    magicCircle.add(createCircleLine(2.1, faintMaterial, 0.026))
    magicCircle.add(createCircleLine(1.1, faintMaterial, 0.026))

    magicCircle.add(createPolygonLine(4.2, 6, lineMaterial, 0.035))
    magicCircle.add(createPolygonLine(3.2, 3, faintMaterial, 0.026))
    magicCircle.add(createPolygonLine(2.5, 8, faintMaterial, 0.026))

    magicCircle.add(createRadialLines(5, 24, faintMaterial, 0.018))

    const starGroup = new THREE.Group()

    starGroup.add(createPolygonLine(2.8, 3, lineMaterial, 0.035))

    const invertedTriangle = createPolygonLine(2.8, 3, lineMaterial, 0.035)
    invertedTriangle.rotation.z = Math.PI
    starGroup.add(invertedTriangle)

    magicCircle.add(starGroup)

    const clock = new THREE.Clock()
    let animationId = 0

    const colors = [
      new THREE.Color(0xff4fd8),
      new THREE.Color(0xd65cff),
      new THREE.Color(0x8b5cff),
      new THREE.Color(0x4f8cff),
      new THREE.Color(0xffb84f),
      new THREE.Color(0xff5c8a),
    ]

    const animate = () => {
      animationId = window.requestAnimationFrame(animate)

      const elapsed = clock.getElapsedTime()

      magicCircle.rotation.z = elapsed * 0.08
      starGroup.rotation.z = -elapsed * 0.15

      const colorSpeed = 0.45
      const colorIndex = (elapsed * colorSpeed) % colors.length

      const currentIndex = Math.floor(colorIndex)
      const nextIndex = (currentIndex + 1) % colors.length
      const mixAmount = colorIndex - currentIndex

      const color = colors[currentIndex]
        .clone()
        .lerp(colors[nextIndex], mixAmount)

      lineMaterial.color.copy(color)
      faintMaterial.color.copy(color)

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.cancelAnimationFrame(animationId)

      magicCircle.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
        }
      })

      lineMaterial.dispose()
      faintMaterial.dispose()
      renderer.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-[#f3f3f3]"
    />
  )
}
