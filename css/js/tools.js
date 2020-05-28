;(function (w) {
	w.tools = {}
	w.mark = {}

	tools.addClass = function (node, className) {
		var reg = new RegExp('\\b' + className + '\\b')
		if (!reg.test(node.className)) {
			node.className += ' ' + className
		}
	}
	tools.removeClass = function (node, className) {
		if (node.className) {
			var reg = new RegExp('\\b' + className + '\\b')
			var classes = node.className
			node.className = classes.replace(reg, '')
			if (/^\s*$/g.test(node.className)) {
				node.removeAttribute('class')
			}
		} else {
			node.removeAttribute('class')
		}
	}
	w.mark.css = function css(node, type, value) {
		if (typeof node !== 'object') {
			return
		}

		if (typeof node['transformObj'] === 'undefined') {
			node['transformObj'] = {}
		}
		const obj = node['transformObj']

		// 设置 操作
		if (arguments.length >= 3) {
			let text = ''
			obj[type] = value

			for (item in obj) {
				// 保证不在原型链上
				if (obj.hasOwnProperty(item)) {
					switch (item) {
						case 'translateX':
						case 'translateY':
						case 'translateZ':
							// text += item + `(${obj[item]}px)`
							const size = document.documentElement.clientWidth / 16
							let foo = `${obj[item]}` / size
							// console.log(foo, obj[item])
							text += item + `(${foo}rem)`
							break
						case 'scale':
							text += item + '(' + obj[item] + ')'
							break
						case 'rotate':
							text += item + '(' + node['transform'][item] + 'deg)'
							break
					}
				}
			}
			node.style.transform = node.style.webkitTransform = text
		}
		//读取操作
		if (arguments.length === 2) {
			value = obj[type]
			if (!value) {
				if (type === 'translateX' || type === 'translateY' || type === 'rotate') {
					value = 0
				}
				if (type === 'scale') {
					value = 1
				}
			}
			return value
		}
	}
	w.mark.carousel = function carousel(arr) {
		const carouselWrap = document.querySelector('.carousel-wrap') // 最外层 <div class="points-wrap">
		const originLength = arr.length // 原来的长度  5
		const isCarousel = carouselWrap.getAttribute('showCarousel') === '' ? true : false
		const isAutoMove = carouselWrap.getAttribute('autoMove') === '' ? true : false

		let ulNode = document.createElement('ul') // 图片ul列表 很大

		let timer = null //定时器
		let currentIndex = 0 // 距离右边的距离比例

		// 是否有最外层 包裹器 <div class="points-wrap">
		if (carouselWrap) {
			ulNode = document.createElement('ul')

			// 是否无缝轮播
			if (isCarousel) {
				// 图片列表 * 2
				arr = arr.concat(arr)
			}
			// 1.动态创建结构
			ulNode.classList.add('list')
			arr.map(item => {
				ulNode.innerHTML += `
				<a href="javascript:;">
					<li>
						<img src="${item}" />
					</li>
				</a>
				`
			})
			// 3D 硬件加速
			mark.css(ulNode, 'translateZ', 0)
			// 2、动态创建样式节点
			const styleNode = document.createElement('style')
			styleNode.innerHTML = `
     .carousel-wrap > .list > a {
       width: ${100 / arr.length}%;
     }
     .carousel-wrap > .list {
       width: ${arr.length * 100}%;
     }`

			// carousel-wrap 样式表 - 设置定位的时候高度会消失
			setTimeout(() => {
				// dom结构还没有渲染在页面上
				const imgNode = document.querySelector('.carousel-wrap > .list > a > li > img')
				carouselWrap.style.height = imgNode.offsetHeight + 'px'
			}, 100)

			// 3、 追加节点
			document.head.appendChild(styleNode) // 样式节点ul列表
			carouselWrap.appendChild(ulNode) // dom结构节点 ul列表

			// 滑屏代码 + 样式控制
			// let currentIndex = 0 // 做成ul滑动的距离比例，不做成图片的下标
			// let leftDistance = 0 // 右偏移量

			const viewWidth = document.documentElement.clientWidth // 布局视口
			let fingerStartX = 0 // 手指刚开始触摸的位置
			let eleStartX = 0 // 距离图片包裹器最左边的位置
			let moveDistance = 0 // 手指移动的距离
			// let pointsNode = '' // span节点列表 小圆点们

			// 防抖动
			let fingerStartY = 0
			let eleStartY = 0
			let isX = true
			let isFirst = true

			// 如果有小圆点的标记结构 	<div class="points-wrap"> 创建span 群结构
			const pointsWrap = document.querySelector('.points-wrap')
			if (pointsWrap) {
				for (let i = 0; i < originLength; i++) {
					pointsWrap.innerHTML += '<span></span>'
					if (i === 0) {
						pointsWrap.innerHTML = '<span class="active"></span>'
					}
				}
			}

			carouselWrap.addEventListener('touchstart', function (e) {
				e = e || event
				// 无缝轮播 边缘处理
				if (isCarousel) {
					// 计算比例
					let index = mark.css(ulNode, 'translateX') / viewWidth

					// 如果是图片的第1 张，刚开始按下去的时候就跳转第6 张
					if (-index === 0) {
						index = -(originLength - 1) - 1
					}
					// 如果是图片的第10张，刚开始按下去的时候就跳转第5张
					if (-index === arr.length - 1) {
						index = -(originLength - 1)
					}

					mark.css(ulNode, 'translateX', index * viewWidth)
				}

				// eleStartX = ulNode.offsetLeft
				// eleStartX = leftDistance
				fingerStartX = e.changedTouches[0].clientX
				eleStartX = mark.css(ulNode, 'translateX')
				fingerStartY = e.changedTouches[0].clientY
				eleStartY = mark.css(ulNode, 'translateY')

				// 清除动画
				ulNode.style.transition = 'none'

				// 关闭自动定时器
				if (isAutoMove) {
					clearInterval(timer)
				}

				isX = true
				isFirst = true
			})

			carouselWrap.addEventListener('touchmove', function (e) {
				// 看门狗，如果单次滑动（手指还没有松开）判断的Y轴滑动，不执行
				if (!isX) {
					return
				}
				// moveDiastance < 0 向左移动
				// left > 0 向右移动， left < 0 向左移动
				// ulNode.style.left = eleStartX + moveDistance + 'px'

				// leftDistance = eleStartX + moveDistance
				// ulNode.style.transform = ` translateX(${leftDistance}px)`

				e = e || event
				let nowFingerX = e.changedTouches[0].clientX
				let nowFingerY = e.changedTouches[0].clientY
				// 手指移动的距离 有正负，代表方向，以最左边最基准
				moveDistance = nowFingerX - fingerStartX
				moveDistanceY = nowFingerY - fingerStartY

				// touchmove事件几乎每隔一像素就会触发一次，如果没有isFirst限制，会执行多次
				// 获取第一次的（第一个和第二个像素点之间的）位移矢量方向
				if (isFirst) {
					isFirst = false
					if (Math.abs(moveDistanceY) > Math.abs(moveDistance)) {
						// y轴移动
						return (isX = false)
					}
				}

				// 跟随移动
				mark.css(ulNode, 'translateX', eleStartX + moveDistance)
			})

			carouselWrap.addEventListener('touchend', function (e) {
				e = e || event

				// currentIndex = ulNode.offsetLeft / viewWidth
				// const Distance = mark.css(ulNode, 'translateX')
				currentIndex = mark.css(ulNode, 'translateX') / viewWidth

				// 1.移动的偏移量百分比 50%
				// currentIndex = Math.round(currentIndex)

				// 2.(一划就动) 根据手指移动的距离  moveDiastance < 0 向左移动
				if (moveDistance > 0) {
					currentIndex = Math.ceil(currentIndex)
				} else if (moveDistance < 0) {
					currentIndex = Math.floor(currentIndex)
				}

				// 不是无缝的边缘处理，只能滑动 10 张
				if (currentIndex > 0) {
					currentIndex = 0
				} else if (currentIndex < 1 - arr.length) {
					currentIndex = 1 - arr.length
				}

				// 布置小圆点激活样式
				pointsStyle(currentIndex, originLength)

				// 布置动画
				ulNode.style.transition = '.5s transform'

				// ulNode.style.left = currentIndex * viewWidth + 'px'
				// leftDistance = currentIndex * viewWidth
				// ulNode.style.transform = `translateX(${leftDistance}px)`
				mark.css(ulNode, 'translateX', currentIndex * viewWidth)

				//开启定时器
				if (isAutoMove) {
					autoMove(10)
				}
			})
		}
		// 是否展示定时器
		if (isAutoMove) {
			autoMove(10)
		}

		/**
		 * 布置小圆点激活样式
		 */
		function pointsStyle(index, length) {
			// querySelector坑，重新获取
			pointsNode = document.querySelectorAll('.points-wrap>span')
			if (pointsNode) {
				for (let i = 0; i < pointsNode.length; i++) {
					pointsNode[i].classList.remove('active')
				}
				pointsNode[-index % length].classList.add('active')
			}
		}

		/**
		 * 定时器
		 */
		function autoMove(length) {
			// let index = 0 // 抽象为图片下标索引 0，1，2，。。。
			index = -currentIndex
			// 清除闭包的timer
			clearInterval(timer)

			timer = setInterval(() => {
				if (index === length - 1) {
					index = length / 2 - 1 // 先瞬间跳转到第一组最后一张 4
					ulNode.style.transition = 'none'
					mark.css(ulNode, 'translateX', -index * document.documentElement.clientWidth)
				}
				// 4 -> 5  这里是异步的
				setTimeout(() => {
					index++
					ulNode.style.transition = '1s transform'
					mark.css(ulNode, 'translateX', -index * document.documentElement.clientWidth)

					// 布置小圆点激活样式
					pointsStyle(-index, length / 2)
				}, 50)
			}, 2000)
		}
	}
	w.mark.drag = function drag(wrapNode, eleNode) {
		// 基本滑屏元素
		let fingerStartX = 0 // 手指相对于屏幕开始的距离
		let eleStartX = 0 // 滑屏元素（ul 图片列表）相对于 最左边的距离
		// 3D 硬件加速
		// mark.css(eleNode, 'translateZ', 0)
		let moveDistance = 0 // 手指移动的距离，有正负代表方向
		let minX = wrapNode.clientWidth - eleNode.offsetWidth // 负数是代表左滑动的距离
		let viewWidth = document.documentElement.clientWidth

		// 快速滑屏元素
		let lastTime = 0 // 上一次触摸屏幕的时间戳
		let lastPoint = 0 // 上一次触摸屏幕的距离（相对于最左边）
		let timeDis = 0 // 时间跨度（距离这一次）
		let pointDis = 0 // 距离跨度（距离这一次）

		// 计算每次的开始位置（手指位置，元素的偏移量）
		wrapNode.addEventListener('touchstart', e => {
			e = e || event
			fingerStartX = e.changedTouches[0].clientX
			eleStartX = mark.css(eleNode, 'translateX')

			// 回弹动画清除
			eleNode.style.transition = 'none'

			// 计算速度
			lastTime = new Date().getTime()
			lastPoint = mark.css(eleNode, 'translateX')

			// 清除速度残留
			pointDis = 0
		})

		// 橡皮筋开始效果，在每一次touchmove过程中，移动的距离还在变大，有效距离在变小
		wrapNode.addEventListener('touchmove', e => {
			e = e || event
			let nowDistance = e.changedTouches[0].clientX
			moveDistance = nowDistance - fingerStartX // 正代表向右， 负代表向左
			let translateX = moveDistance + eleStartX // 计算最后移动的距离
			let scale = 0 // 计算比例橡皮筋效果的

			// 右滑动的极限距离 translateX = 0
			if (translateX > 0) {
				scale = viewWidth / ((translateX + viewWidth) * 1.5)
				translateX = moveDistance * scale + eleStartX
			}
			// 左滑动的极限距离 translateX = minX
			else if (translateX < minX) {
				let over = minX - translateX
				scale = viewWidth / ((over + viewWidth) * 1.5)
				translateX = moveDistance * scale + eleStartX
			}
			// translateX = moveDistance * scale + eleStartX
			mark.css(eleNode, 'translateX', translateX)

			// 计算速度
			let nowTime = new Date().getTime()
			let nowPoint = mark.css(eleNode, 'translateX')

			timeDis = nowTime - lastTime
			pointDis = nowPoint - lastPoint

			lastTime = nowTime
			lastPoint = nowPoint
		})

		// 橡皮劲的结束时回弹效果
		wrapNode.addEventListener('touchend', e => {
			e = e || event
			let translateX = mark.css(eleNode, 'translateX')
			//速度越大  位移越远
			let speed = pointDis / timeDis
			speed = Math.abs(speed) < 0.3 ? 0 : speed // 速度过慢，代表不希望快速滑屏
			let targetX = translateX + speed * 150 // 快速滑屏和普通滑屏

			let time = Math.abs(speed) * 0.1 // 动画的时间控制
			time = time < 0.8 ? 0.8 : 1.3
			let bsr = '' // cubic-bezier控制

			// 右滑动的回弹效果
			if (targetX > 0) {
				// mark.css(eleNode, 'translateX', 0)
				bsr = 'cubic-bezier(.26,1.51,.68,1.54)'
				targetX = 0
			}
			// 左滑动的回弹效果
			else if (targetX < minX) {
				// mark.css(eleNode, 'translateX', minX)
				targetX = minX
				bsr = 'cubic-bezier(.26,1.51,.68,1.54)'
			}
			// 回弹动画时间
			eleNode.style.transition = `${time}s ${bsr} transform`
			mark.css(eleNode, 'translateX', targetX)
		})
	}
	w.mark.scrollBar = function (wrapNode, eleNode, callback) {
		// 3D 硬件加速
		mark.css(eleNode, 'translateZ', 1)
		// 基本滑屏元素
		let fingerStart = { y: 0, x: 0 } // 手指相对于屏幕头部的位移（和滚动没有关系）
		let eleStart = { y: 0, x: 0 } // 滑屏元素相对于 最上边的距离
		let moveDistanceY = 0 // 手指移动的距离，有正负代表方向
		let minY = wrapNode.clientHeight - eleNode.offsetHeight // 负数是代表左滑动的距离
		let viewHeight = wrapNode.offsetHeight
		// 快速滑屏元素
		let lastTime = 0 // 上一次触摸屏幕的时间戳
		let lastPoint = 0 // 上一次触摸屏幕的距离（相对于最左边）
		let timeDis = 0 // 时间跨度（距离这一次）
		let pointDis = 0 // 距离跨度（距离这一次）
		// 防抖动
		let isY = true
		let isFirst = true
		// tween算法动画
		let timer = null
		// 回调函数创建滚动条

		if (callback && typeof callback.createBar === 'function') {
			callback.createBar(wrapNode)
		}
		// 计算每次的开始位置（手指位置，元素的偏移量）
		wrapNode.addEventListener('touchstart', e => {
			// 即点即停
			clearInterval(timer)
			e = e || event
			fingerStart.y = e.changedTouches[0].clientY
			fingerStart.x = e.changedTouches[0].clientX
			eleStart.y = mark.css(eleNode, 'translateY')
			eleStart.x = mark.css(eleNode, 'translateX')
			// 回弹动画清除, 这里原始的时即点即到目标位置
			eleNode.style.transition = 'none'
			// 计算速度
			lastTime = new Date().getTime()
			lastPoint = mark.css(eleNode, 'translateY')
			// 清除速度残留
			pointDis = 0
			// 重置防抖动数据
			isY = true
			isFirst = true
			// 回调函数
			if (callback && typeof callback.start === 'function') callback.start.call(eleNode)
			// 滚动条尽可能的不出现
			// if (timer && callback.end && typeof callback.end === 'function') callback.end.call(eleNode)
		})
		// 橡皮筋开始效果，在每一次touchmove过程中，移动的距离还在变大，有效距离在变小
		wrapNode.addEventListener('touchmove', e => {
			// 防抖动
			if (!isY) return
			e = e || event
			let nowDistanceY = e.changedTouches[0].clientY
			let nowDistanceX = e.changedTouches[0].clientX
			moveDistanceY = nowDistanceY - fingerStart.y // 正代表向右， 负代表向左
			moveDistanceX = nowDistanceX - fingerStart.x // 正代表向右， 负代表向左
			let translateY = moveDistanceY + eleStart.y // 计算最后移动的距离

			let scale = 0 // 计算比例（超出范围内的）橡皮筋效果的

			// 防抖动
			if (isFirst) {
				isFirst = false
				if (Math.abs(moveDistanceX) > Math.abs(moveDistanceY)) {
					return (isY = false)
				}
			}
			// 下拉的极限距离 translateY = 0
			if (translateY > 0) {
				scale = viewHeight / ((translateY + viewHeight) * 1.5)
				translateY = moveDistanceY * scale + eleStart.y
			}
			// 上滑动的极限距离 translateY = minY
			else if (translateY < minY) {
				let over = minY - translateY
				scale = over / ((over + viewHeight) * 0.8)
				translateY = moveDistanceY * scale + eleStart.y
			}
			mark.css(eleNode, 'translateY', translateY)
			// 计算速度
			let nowTime = new Date().getTime()
			let nowPoint = mark.css(eleNode, 'translateY')
			timeDis = nowTime - lastTime
			pointDis = nowPoint - lastPoint
			lastTime = nowTime
			lastPoint = nowPoint
		})
		// 橡皮劲的结束时回弹效果
		wrapNode.addEventListener('touchend', e => {
			e = e || event
			let translateY = mark.css(eleNode, 'translateY')
			//速度越大  位移越远
			let speed = pointDis / timeDis
			speed = Math.abs(speed) < 0.3 ? 0 : speed // 速度过慢，代表不希望快速滑屏
			let targetY = translateY + speed * 150 // 快速滑屏和普通滑屏
			let time = Math.abs(speed) * 0.1 // 动画的时间控制
			time = time < 0.8 ? 0.8 : 1
			let bsr = '' // cubic-bezier控制 // bsr = 'cubic-bezier(.26,1.51,.68,1.54)'
			let type = 'Linear' // Tween动画的类别
			let startY = mark.css(eleNode, 'translateY')
			// 下滑动的回弹效果
			if (targetY > 0) {
				targetY = 0
				type = 'Back'
			}
			// 上滑动的回弹效果
			else if (targetY < minY) {
				targetY = minY
				type = 'Back'
			}
			tweenMove(eleNode, startY, targetY - startY, type)

			// 过渡动画 动画会在touchstart中销毁
			// eleNode.style.transition = `${time * 5}s ${bsr} transform`
			// mark.css(eleNode, 'translateY', targetY)
			// let startY = mark.css(eleNode, 'translateY')
		})
		/**
		 * Tween算法实现动画
		 */
		function tweenMove(node, b, c, type = 'Linear') {
			// 如果用户乱点，不给予触发移动动画
			if (timer) {
				clearInterval(timer)
				timer = null // 配合滚动条
			}

			// 如果移动的距离为0，返回
			if (!c) return

			let Tween = {
				Linear: function (t, b, c, d) {
					return -c * (t /= d) * (t - 2) + b
				},
				Back: function (t, b, c, d) {
					return -c * ((t = t / d - 1) * t * t * t - 1) + b
				}
			}
			let time = type === 'Linear' ? 700 / 100 : 370 / 60
			let i = 0 // 第几帧（第几个间隔）
			// let b = 0 // 开始的距离
			// let c = 0 // 目标距离 - 开始的距离
			let d = 140 // 总次数
			let s = 0 // 回弹距离，有默认值
			timer = setInterval(() => {
				if (++i > d) {
					clearInterval(timer)
					// 回调函数
					if (callback && typeof callback.end === 'function') callback.end.call(eleNode)
				}
				// 回调函数
				if (callback && typeof callback.move === 'function') {
					callback.move.call(eleNode, type === 'Back')
				}
				mark.css(node, 'translateY', Tween[type](i, b, c, d))
			}, time)
		}
	}
})(window)
