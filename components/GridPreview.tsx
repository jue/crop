import React, { useRef, useState, useEffect, useCallback } from 'react'
import { GridConfig } from '../types'

interface GridPreviewProps {
  file: File | null
  config: GridConfig
  t: any
  onPositionChange?: (position: { x: number; y: number }) => void
  onImageSizeChange?: (sizes: {
    naturalWidth: number
    naturalHeight: number
    displayWidth: number
    displayHeight: number
  }) => void
}

const GridPreview: React.FC<GridPreviewProps> = ({
  file,
  config,
  t,
  onPositionChange,
  onImageSizeChange
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
    lastPosition: { x: 0, y: 0 }
  })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setImageUrl(null)
      // Reset position when file changes
      setPosition({ x: 0, y: 0 })
    }
  }, [file])

  // Update container size when component mounts or window resizes
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }

    updateContainerSize()
    window.addEventListener('resize', updateContainerSize)
    return () => window.removeEventListener('resize', updateContainerSize)
  }, [])

  // Handle image load to get dimensions
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      // Get natural dimensions of the image
      const naturalWidth = imageRef.current.naturalWidth
      const naturalHeight = imageRef.current.naturalHeight

      // Get container dimensions
      const containerWidth = containerRef.current.clientWidth
      const containerHeight = containerRef.current.clientHeight

      // Calculate displayed dimensions based on container and aspect ratio
      const aspectRatio = naturalWidth / naturalHeight
      let displayWidth = containerWidth
      let displayHeight = containerWidth / aspectRatio

      // Limit to container height
      if (displayHeight > containerHeight) {
        displayHeight = containerHeight
        displayWidth = containerHeight * aspectRatio
      }

      setImageSize({ width: displayWidth, height: displayHeight })
      // Reset position when image loads
      setPosition({ x: 0, y: 0 })

      // Notify parent component about image sizes
      if (onImageSizeChange) {
        onImageSizeChange({
          naturalWidth,
          naturalHeight,
          displayWidth,
          displayHeight
        })
      }
    }
  }, [onImageSizeChange])

  // Calculate boundaries to prevent image from going outside container
  const calculateBoundaries = useCallback(() => {
    // 确保尺寸有效
    if (
      imageSize.width <= 0 ||
      imageSize.height <= 0 ||
      containerSize.width <= 0 ||
      containerSize.height <= 0
    ) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }

    // 计算可移动的最大距离
    const maxX = Math.max(0, imageSize.width - containerSize.width) / 2
    const maxY = Math.max(0, imageSize.height - containerSize.height) / 2

    return {
      minX: -maxX,
      maxX: maxX,
      minY: -maxY,
      maxY: maxY
    }
  }, [imageSize, containerSize])

  // Handle mouse down on image
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        lastPosition: { ...position }
      })
    },
    [position]
  )

  // 单独的触摸事件处理函数
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // 获取第一个触摸点
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({
        x: touch.clientX,
        y: touch.clientY,
        lastPosition: { ...position }
      })
    },
    [position]
  )

  // Handle mouse move for dragging - 简化和优化拖动实现
  useEffect(() => {
    if (!isDragging) return

    // 使用闭包变量来避免依赖问题
    let currentDragStart = { ...dragStart }

    const handleMouseMove = (e: MouseEvent) => {
      // 防止浏览器默认行为
      e.preventDefault()

      // 简单直接的计算方式
      const deltaX = e.clientX - currentDragStart.x
      const deltaY = e.clientY - currentDragStart.y

      // 计算新位置
      let newX = currentDragStart.lastPosition.x + deltaX
      let newY = currentDragStart.lastPosition.y + deltaY

      // 简单的边界检查 - 暂时移除复杂的边界逻辑以测试基本功能
      // 我们直接设置一个宽松的边界，允许自由移动
      if (imageSize.width > containerSize.width) {
        // 只有当图片大于容器时才限制X轴
        const maxX = (imageSize.width - containerSize.width) / 2
        newX = Math.max(-maxX, Math.min(maxX, newX))
      } else {
        // 图片小于容器时居中
        newX = 0
      }

      if (imageSize.height > containerSize.height) {
        // 只有当图片大于容器时才限制Y轴
        const maxY = (imageSize.height - containerSize.height) / 2
        newY = Math.max(-maxY, Math.min(maxY, newY))
      } else {
        // 图片小于容器时居中
        newY = 0
      }

      // 直接设置位置，不经过复杂的calculateBoundaries
      const newPosition = { x: newX, y: newY }
      setPosition(newPosition)
      // 通知父组件位置变化
      if (onPositionChange) {
        onPositionChange(newPosition)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    // 使用passive: false确保preventDefault有效
    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, imageSize, containerSize])

  if (!imageUrl) {
    return (
      <div className="w-full h-96 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-lg font-medium">{t.noImage}</p>
          <p className="text-sm">{t.uploadToPreview}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={containerRef}
        className={`relative overflow-hidden shadow-lg rounded-lg border transition-all duration-200 ${
          isDragging ? 'border-blue-400 shadow-blue-400/30' : 'border-slate-200'
        } bg-white`}
        style={{ maxWidth: '100%' }}
      >
        {/* The Image with drag functionality */}
        <div
          className="relative overflow-hidden"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Preview"
            className="block w-full h-auto object-contain"
            style={{
              // 直接设置transform属性
              transform: `translate(${position.x}px, ${position.y}px)`,
              // 确保选择被禁用
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              // 明确的鼠标样式
              cursor: isDragging ? 'grabbing' : 'grab',
              // 拖动时不使用过渡效果
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              // 确保事件可以正常触发
              pointerEvents: 'auto',
              // 确保图片占据所有可用空间
              display: 'block'
            }}
            draggable={false}
            onLoad={handleImageLoad}
            onMouseDown={handleMouseDown}
            // 添加触摸支持
            onTouchStart={handleTouchStart}
          />
        </div>

        {/* The Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical Lines (Columns) */}
          {Array.from({ length: config.cols - 1 }).map((_, i) => (
            <div
              key={`col-${i}`}
              className="absolute top-0 bottom-0 border-l border-white/50 shadow-[1px_0_0_0_rgba(0,0,0,0.3)]"
              style={{ left: `${(100 / config.cols) * (i + 1)}%` }}
            />
          ))}

          {/* Horizontal Lines (Rows) */}
          {Array.from({ length: config.rows - 1 }).map((_, i) => (
            <div
              key={`row-${i}`}
              className="absolute left-0 right-0 border-t border-white/50 shadow-[0_1px_0_0_rgba(0,0,0,0.3)]"
              style={{ top: `${(100 / config.rows) * (i + 1)}%` }}
            />
          ))}

          {/* Numbers overlay (optional, for verification) */}
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
              gridTemplateRows: `repeat(${config.rows}, 1fr)`
            }}
          >
            {Array.from({ length: config.rows * config.cols }).map((_, i) => (
              <div key={i} className="flex items-center justify-center">
                <span className="text-[10px] text-white/80 bg-black/30 px-1 rounded-sm backdrop-blur-sm">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Drag indicator */}
        {isDragging && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md shadow-md">
            拖动中...
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
        <span>
          {t.previewInfo
            .replace('{cols}', config.cols)
            .replace('{rows}', config.rows)}
        </span>
        {imageUrl && <span className="text-slate-400">•</span>}
        {imageUrl && (
          <span className="text-slate-400">点击并拖动图片调整位置</span>
        )}
      </div>
    </div>
  )
}

export default GridPreview
