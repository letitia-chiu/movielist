////// Global Variables //////
// --- API Settings //
const BASE_URL = 'https://webdev.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/movies/'
const POSTER_URL = BASE_URL + '/posters/'

// --- General Settings //
const VIEW_MODE = {
  CardView: 'CardView',
  ListView: 'ListView'
}
const MOVIES_PER_PAGE = 12

// --- DOM Settings //
const dataPanel = document.querySelector('#data-panel')
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-form-input')
const paginator = document.querySelector('#paginator')
const modalTitle = document.querySelector('#movie-modal-title')
const modalImage = document.querySelector('#movie-modal-image')
const modalDate = document.querySelector('#movie-modal-date')
const modalDescription = document.querySelector('#movie-modal-description')
const viewSwitcher = document.querySelector('.view-switcher')


////// Model-View-Controller //////
const model = {
  // Temporary Data
  movies: [],
  filteredMovies: [],
  favoriteMovies: JSON.parse(localStorage.getItem('favoriteMovies')) || [],
  pageAmount() {
    if (model.isSearchMode()) {
      return Math.ceil(model.filteredMovies.length / MOVIES_PER_PAGE)
    } else {
      return Math.ceil(model.movies.length / MOVIES_PER_PAGE)
    }
  },

  // View State
  currentViewMode: VIEW_MODE.CardView,
  currentPage: 1,
  isSearchMode() {return this.filteredMovies.length > 0}
}

const view = {
  renderMovieList(data, viewMode) {
    // 宣告 template literal
    let rawHTML = ''

    // 依照檢視模式選擇 HTML 樣板
    switch(viewMode) {
      // Case 1: 卡片模式
      case VIEW_MODE.CardView:
        data.forEach(item => {
          rawHTML += `
            <div class="col-sm-3">
              <div class="mb-2">
                <div class="card">
                  <img
                    src="${POSTER_URL}${item.image}"
                    class="card-img-top" alt="Movie Poster">
                  <div class="card-body">
                    <h5 class="card-title">${item.title}</h5>
                  </div>
                  <div class="card-footer text-muted">
                    <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal"
                      data-bs-target="#movie-modal" data-id="${item.id}">More</button>
                    <button class="btn btn-info btn-add-favorite ms-2" data-id="${item.id}"><i class="fa-solid fa-plus"></i></button>
                  </div>
                </div>
              </div>
            </div>
          `
        })
        break
      // -- Case 1 End --

      // Case 2: 清單模式
      case VIEW_MODE.ListView:
        // 處理 HTML 頂部架構
        rawHTML += `
          <div class="table-responsive">
            <table class="table align-middle">
              <thead>
                <tr>
                  <th>Poster</th>
                  <th>Title</th>
                  <th></th> <!-- more和add按鈕 -->
                </tr>
              </thead>
              <tbody>
        `
        // 處理 HTML 中段內容（電影清單）
        data.forEach(item => {
          rawHTML += `
            <tr>
              <td>
                <img src="${POSTER_URL}${item.image}" width="50" class="img-thumbnail" />
              </td>
              <td>${item.title}</td>
              <td>
                <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal"
                    data-id="${item.id}">More</button>
                <button class="btn btn-info btn-add-favorite ms-2" data-id="${item.id}"><i class="fa-solid fa-plus"></i></button>
              </td>
            </tr>
          `
        })
        // 處理 HTML 尾部架構
        rawHTML += `
              </tbody>
            </table>
          </div>
        `
      // -- Case 2 End --
    } // -- Switch End --
    
    // 置換 data panel 之 HTML content
    dataPanel.innerHTML = rawHTML
    // 置換已加最愛的按鈕樣式
    this.markFavorite(...document.querySelectorAll('.btn-add-favorite'))
  },

  renderPaginator(pageAmount) {      
    // 建立 paginator 的 HTML content
    let rawHTML = ''
    for (let page = 1; page <= pageAmount; page++) {
      rawHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`
    }
    paginator.innerHTML = rawHTML

    // 標記目前頁面
    this.markCurrentPage(model.currentPage)
  },

  renderPageContent(data, viewMode, pageAmount) {
    this.renderMovieList(data, viewMode)
    this.renderPaginator(pageAmount)
  },

  renderMovieModal(data) {
    // 將原始 modal 之 HTML content 置換成取得的資料
    modalTitle.innerText = data.title
    modalImage.innerHTML = `
      <img src="${POSTER_URL}${data.image}" alt="movie-poster" class="img-fluid">
    `
    modalDate.innerText = 'Release date: ' + data.release_date
    modalDescription.innerText = data.description
  },

  renderSearchNotFound(keyword) {
    dataPanel.innerHTML = `
      <div class="col-sm-12">
        <div class="mb-2">
          <p>Unable to find any movies related to the keyword ' <em>${keyword}</em> '.</p>
        </div>
      </div>
    `
    paginator.innerHTML = ''
  },

  markCurrentPage(page) {
    const pageLinks = [...document.querySelectorAll('.page-link')]
    pageLinks.forEach((pageLink) => pageLink.classList.remove('active'))
    const activePageLink = pageLinks.find((pageLink) => Number(pageLink.dataset.page) === page)
    activePageLink.classList.add('active')
  },

  markFavorite(...favoriteButtons) {
    const favoriteIDs = model.favoriteMovies.map((movie) => movie.id)
    const targets = favoriteButtons.filter((btn) => favoriteIDs.includes(Number(btn.dataset.id)))
    targets.forEach((target) => {
      target.className = "btn btn-danger favorites ms-2"
      target.innerHTML = `<i class="fa-solid fa-heart"></i>`
    })
  }
}

const controller = {
  showPageContent(page) {
    // 判斷是否須從API抓取資料
    if (model.movies && !model.movies.length) {
      // 若暫存資料庫內無資料
      axios.get(INDEX_URL).then((response) => {
        // 取得API回傳之物件組，並逐一匯入陣列，再進行渲染
        model.movies.push(...response.data.results)
        view.renderPageContent(this.getMoviesByPage(page), model.currentViewMode, model.pageAmount())

      }).catch((error) => { console.log(error) }) // 錯誤處理
    } else {
      // 暫存資料庫內已有資料，直接執行渲染功能
      view.renderPageContent(this.getMoviesByPage(page), model.currentViewMode, model.pageAmount())
    }
    
  },

  getMoviesByPage(page) {
    const data = model.isSearchMode() ? model.filteredMovies : model.movies
    // 計算起始 index
    const startIndex = (page - 1) * MOVIES_PER_PAGE
    // 回傳切割後的陣列
    return data.slice(startIndex, startIndex + MOVIES_PER_PAGE)
  },

  switchViewMode(target) {
    const viewMode = target.dataset.mode

    // 如果點選的模式為當前模式，則不動作
    if (viewMode === model.currentViewMode) {
      return
    }

    // 切換模式
    document.querySelectorAll('.view').forEach((element) => element.classList.remove('active'))
    target.classList.add('active')
    model.currentViewMode = viewMode
    view.renderMovieList(this.getMoviesByPage(model.currentPage), model.currentViewMode)
  },
  
  showMovieModal(id) {   
    // 自 API 取得指定 id 之資料
    axios.get(INDEX_URL + id).then((response) => {
      const data = response.data.results
      view.renderMovieModal(data)
    })
  },

  showSearchResult(keyword) {
    // 搜尋空值時，清空搜尋結果並回到原始頁面
    if (!keyword.length) {
      model.filteredMovies = []
      model.currentPage = 1
      this.showPageContent(model.currentPage)
      return
    }

    // 比對關鍵字進行篩選
    model.filteredMovies = model.movies.filter((movie) =>
      movie.title.trim().toLowerCase().includes(keyword)
    )

    // 搜尋不到結果時的頁面渲染
    if (!model.filteredMovies.length) {
      view.renderSearchNotFound(keyword)
      return
    }
    // 成功搜尋時重新渲染頁面(搜尋結果第一頁)
    model.currentPage = 1
    this.showPageContent(model.currentPage)
  },

  addToFavorite(target) {
    const id = Number(target.dataset.id) // 取得對應 id

    // 比對點擊對象是否已存在於最愛清單，若已重複則return
    if (model.favoriteMovies.some((movie) => movie.id === id)) {
      return alert('此電影已在最愛清單中')
    }

    // 未重複則加入清單，並儲存至local storage
    const movie = model.movies.find((movie) => movie.id === id)
    model.favoriteMovies.push(movie)
    localStorage.setItem('favoriteMovies', JSON.stringify(model.favoriteMovies))

    // 重新渲染已加最愛按鈕
    view.markFavorite(target)
  },

  goToPage(page) {
    model.currentPage = page
    view.renderMovieList(this.getMoviesByPage(page), model.currentViewMode)
    view.markCurrentPage(page)
  }
}

////// Executing //////
controller.showPageContent(model.currentPage)


////// Event Listeners //////
// --- Panel Click Event //
dataPanel.addEventListener('click', function onPanelClicked(event) {
  // 觸發對象-1: more按鈕
  if (event.target.matches('.btn-show-movie')) {
    // 取得對應 id 並執行 show movie modal 功能
    controller.showMovieModal(Number(event.target.dataset.id))
  }

  // 觸發對象-2: add favorite按鈕
  else if (event.target.matches('.btn-add-favorite')) {
    controller.addToFavorite(event.target)
  } else if (event.target.matches('.fa-plus')) {
    controller.addToFavorite(event.target.parentElement)
  }
})

// --- Search Form Submit Event //
searchForm.addEventListener('submit', function onSearchFormSubmitted(event) {
  event.preventDefault() // 取消瀏覽器預設設定
  const keyword = searchInput.value.trim().toLowerCase() // 取得 input 之搜尋關鍵字
  controller.showSearchResult(keyword) // 執行搜尋結果顯示
})

// --- View Switcher Click Event // 
viewSwitcher.addEventListener('click', function onViewSwitcherClicked(event) {
  if (!event.target.tagName === 'I') {return}
  controller.switchViewMode(event.target)
})

// --- Paginator Click Event
paginator.addEventListener('click', function onPaginatorClicked(event) {
  if (event.target.tagName !== 'A') { return }
  controller.goToPage(Number(event.target.dataset.page))
})