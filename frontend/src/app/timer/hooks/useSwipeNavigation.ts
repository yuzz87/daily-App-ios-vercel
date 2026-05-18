"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * 横スワイプで複数パネルを切り替えるためのHook。
 * マウス操作・タッチ操作の両方に対応する。
 */
export function useSwipeNavigation({
  panelCount,
  threshold = 50,
}: {
  panelCount: number
  threshold?: number
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const lockedAxis = useRef<"horizontal" | "vertical" | null>(null)
  const draggingRef = useRef(false)
  const activeIndexRef = useRef(0)

  // イベント処理内で最新のactiveIndexを参照するため、stateをrefにも同期する
  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  // ドラッグ終了時に、スワイプ量に応じて表示するパネルを確定する
  const commit = useCallback(
    (offset: number) => {
      const next =
        offset < -threshold
          ? Math.min(activeIndexRef.current + 1, panelCount - 1)
          : offset > threshold
            ? Math.max(activeIndexRef.current - 1, 0)
            : activeIndexRef.current

      setActiveIndex(next)
      setDragOffset(0)
      setIsDragging(false)
      draggingRef.current = false
      lockedAxis.current = null
    },
    [threshold, panelCount],
  )

  // ドットクリックなどで、指定したパネルへ移動する
  const goTo = useCallback(
    (i: number) => {
      setActiveIndex(Math.max(0, Math.min(i, panelCount - 1)))
      setDragOffset(0)
    },
    [panelCount],
  )

  /**
   * touchmoveはpassive:falseで直接登録する。
   * 横スワイプ中にpreventDefaultして、画面スクロールと競合しないようにするため。
   */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current) return

      const dx = e.touches[0].clientX - startX.current
      const dy = e.touches[0].clientY - startY.current

      if (lockedAxis.current === null) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          lockedAxis.current =
            Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical"
        }
        return
      }

      if (lockedAxis.current === "horizontal") {
        e.preventDefault()
        setDragOffset(dx)
      }
    }

    el.addEventListener("touchmove", handleTouchMove, { passive: false })
    return () => el.removeEventListener("touchmove", handleTouchMove)
  }, [])

  const handlers = {
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
      startX.current = e.clientX
      startY.current = e.clientY
      draggingRef.current = true
      lockedAxis.current = null
      setIsDragging(true)
    },

    onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return

      const dx = e.clientX - startX.current
      const dy = e.clientY - startY.current

      // 横スワイプか縦スクロールかを最初の移動量で判定する
      if (lockedAxis.current === null) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          lockedAxis.current =
            Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical"
        }
        return
      }

      if (lockedAxis.current === "horizontal") {
        setDragOffset(dx)
      }
    },

    onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return
      commit(e.clientX - startX.current)
    },

    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return
      commit(e.clientX - startX.current)
    },

    onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      draggingRef.current = true
      lockedAxis.current = null
      setIsDragging(true)
    },

    onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return
      commit(e.changedTouches[0].clientX - startX.current)
    },
  }

  return { activeIndex, dragOffset, isDragging, goTo, containerRef, handlers }
}