const firstPageTypes = {
    "2bfc6e58-485f-8006-9d07-fe360e067c6b": "Горожане",
    "2bfc6e58-485f-804b-a4f2-fe76108367bc": "Изгои",
    "2bfc6e58-485f-80b4-b28c-d3f87189b821": "Приспешники",
    "2bfc6e58-485f-8059-b37f-d6cffbccbf6c": "Демоны",
}
const secondPageTypes = {
    "2bfc6e58-485f-8048-884c-fa29f3dbe5d6": "Летописцы",
    "2bfc6e58-485f-8072-9a69-e77527250fcf": "Сказочники",
    "2bfc6e58-485f-80d8-87ae-eb92d2bb40b3": "Странники",
}
const recommendedTravellers = ['thief', 'harlot', 'judge', 'beggar', 'scapegoat']

async function onInit() {
    const { ids, title } = parseQuery()
    const roles = await getJson('./roles.json')
    const jinxes = await getJson('./jinxes.json')
    const travellers = filterRoles(roles, recommendedTravellers)
    const filteredRoles = filterRoles(roles, ids)
    const filteredJinxes = filterJinxes(jinxes, filteredRoles)
    const systemRoles = filterRolesByType(roles, undefined)

    console.log(filteredJinxes)

    renderTitle(title)
    getRoleSections(filteredRoles, firstPageTypes).forEach(section => 
        document.getElementsByClassName('page')[0].appendChild(section))
    document.getElementsByClassName('page')[1].insertBefore(getJinxesSection(filteredRoles, filteredJinxes), document.getElementById('players-count'))
    getRoleSections([...filteredRoles, ...travellers], secondPageTypes).forEach(section => 
        document.getElementsByClassName('page')[1].insertBefore(section, document.getElementById('players-count')))
    
        // renderNightOrder([...filteredRoles, ...systemRoles])
}

function parseQuery() {
    const query = new URLSearchParams(window.location.search)
    const ids = query.get('roles')?.split(',')?.map(id => id.trim())
    const title = query.get('title')?.trim()

    return ({ ids, title })
}

async function getJson(path) {
    const res = await fetch(path)

    if (!res.ok) 
        throw new Error(`Не удалось загрузить {path}`)
    
    return await res.json()
}

function filterRoles(roles, ids) {
    return ids
        .map(id => roles
            .find(role => role?.properties?.ID?.rich_text?.[0]?.plain_text === id))
        .filter(role => !!role)
}

function filterJinxes(jinxes, roles) {
    const ids = roles.map(role => role.id)
    return jinxes.filter(jinx => 
        jinx?.properties?.["Персонажи"]?.relation.every(x => ids.includes(x.id)))
}

function filterRolesByType(roles, typeId) {
    return roles.filter(role =>
        role?.properties?.["Тип"]?.relation?.[0]?.id === typeId
    )
}

function renderTitle(title) {
    document.getElementById("script-title").innerText = title ?? 'Сценарий'
}

function getRoleSections(roles, types) {
    return Object.entries(types).map(([id, name]) => {
        const rolesByType = filterRolesByType(roles, id)
        return renderRoleType(rolesByType, name, id)
    }).filter(x => x)
}

function renderRoleType(roles, name, id) {
    if (roles.length === 0) return

    const section = document.createElement('section')
    section.classList.add('roleType')
    section.style.flexGrow = roles.length;

    if (['2bfc6e58-485f-8006-9d07-fe360e067c6b', '2bfc6e58-485f-804b-a4f2-fe76108367bc'].includes(id))
        section.classList.add('good')
    if (['2bfc6e58-485f-80b4-b28c-d3f87189b821', '2bfc6e58-485f-8059-b37f-d6cffbccbf6c'].includes(id))
        section.classList.add('evil')
    if (['2bfc6e58-485f-8048-884c-fa29f3dbe5d6'].includes(id))
        section.classList.add('fabled')
    if (['2bfc6e58-485f-80d8-87ae-eb92d2bb40b3'].includes(id))
        section.classList.add('traveller')
  
    section.appendChild(renderTypeTitle(name))
    section.appendChild(renderRoleList(roles))

    return section
}

function renderTypeTitle(name) {
    const title = document.createElement('h2')
    title.innerText = name

    return title
}

function renderRoleList(roles) {
    const list = document.createElement('ul')

    for (let index = 0; index < roles.length; index++) {
        const role = roles[index]
        if (!role) continue
        const item = document.createElement('li')
        item.style.order = getRoleOrder(index, roles.length)

        const icon = document.createElement('img')
        const id = role.properties?.ID?.rich_text?.[0]?.plain_text
        icon.src = `./images/roles/${id}.png`
        item.appendChild(icon)

        const name = document.createElement('h3')
        name.innerText = role.properties?.["Название"]?.title?.[0]?.text?.content
        item.appendChild(name)

        const ability = document.createElement('p')
        ability.innerText = role.properties?.["Способность"]?.rich_text?.[0]?.plain_text
        item.appendChild(ability)

        list.appendChild(item)
    }
    
    return list
} 

function getRoleOrder(index, total) {
    const half = Math.ceil(total / 2)

    if (index < half) {
        return index * 2
    }

    return (index - half) * 2 + 1
}

function getJinxesSection(roles, jinxes) {
    if (jinxes.length === 0) return

    const section = document.createElement('section')
    section.classList.add('roleType')
    section.style.flexGrow = jinxes.length;
  
    section.appendChild(renderTypeTitle('Правила Джинна'))
    section.appendChild(renderJinxesList(roles, jinxes))

    return section
}

function renderJinxesList(roles, jinxes) {
    const list = document.createElement('ul')

    for (let index = 0; index < jinxes.length; index++) {
        const jinx = jinxes[index]
        if (!jinx) continue
        const item = document.createElement('li')
        item.classList.add('jinx')
        item.style.order = getRoleOrder(index, jinxes.length)

        const rolePageIds = jinx?.properties?.["Персонажи"]?.relation?.map(x => x.id)
        const roleIds = rolePageIds
            .map(pageId => roles.find(x => x.id === pageId))
            .map(page => page.properties?.ID?.rich_text?.[0]?.plain_text)

        const icon1 = document.createElement('img')
        icon1.src = `./images/roles/${roleIds[0]}.png`
        item.appendChild(icon1)

        const icon2 = document.createElement('img')
        icon2.src = `./images/roles/${roleIds[1]}.png`
        item.appendChild(icon2)

        const ability = document.createElement('p')
        ability.innerText = jinx.properties?.["Правило"]?.title.map(x => x.plain_text).join("")
        item.appendChild(ability)

        list.appendChild(item)
    }
    
    return list
} 

function renderNightOrder(roles) {
    const firstNight = getNightOrderList(roles, "Первая ночь порядок")
    document.getElementsByClassName('page')[2].appendChild(firstNight)
}

function getNightOrderList(roles, key) {
    const list = document.createElement('ul')
    const filteredRoles = roles
        .filter(a => a?.properties?.[key]?.number !== null)
        .sort((a, b) => a?.properties?.[key]?.number - b?.properties?.[key]?.number)

    for (const role of filteredRoles) {
        const item = document.createElement('li')

        const icon = document.createElement('img')
        const id = role.properties?.ID?.rich_text?.[0]?.plain_text
        icon.src = `./images/roles/${id}.png`
        item.appendChild(icon)

        const name = document.createElement('h3')
        name.innerText = role.properties?.["Название"]?.title?.[0]?.text?.content
        item.appendChild(name) 
        
        list.appendChild(item)
    }

    return list
}

onInit()