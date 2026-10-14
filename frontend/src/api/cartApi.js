const API_BASE_URL = 'http://localhost:5001'

const getToken = () => {
    return localStorage.getItem('campushub_token')
}

const getAuthHeaders = () => {
    const token = getToken()

    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }
}

export const getCart = async () => {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'GET',
        headers: getAuthHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch cart')
    }

    return data
}

export const addToCart = async (menuItemId, quantity = 1) => {
    const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            menuItemId,
            quantity,
        }),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to add item to cart')
    }

    return data
}

export const removeCartItem = async (itemId) => {
    const response = await fetch(
        `${API_BASE_URL}/api/cart/item/${itemId}`,
        {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to remove item')
    }

    return data
}

export const clearCart = async () => {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Failed to clear cart')
    }

    return data
}