'use client'

import React, { useState, useEffect, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart-context'
import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  ShoppingBag,
  Clock,
  Users,
  Plus,
  Minus,
  Loader2,
  Utensils,
  ShieldAlert,
  Sparkles,
  Truck,
  ShieldCheck,
  Zap,
  Flame,
  Fish,
  Check,
  AlertCircle,
  XCircle,
} from 'lucide-react'

interface Option {
  name: string
  price_modifier: number
  is_available: boolean
  description?: string

  has_counter?: boolean

  unit_price?: number

  /*
   * ADMIN MULTIPLIER
   *
   * Example:
   * multiplier = 5
   * customer counter starts at 6
   *
   * multiplier = 10
   * customer counter starts at 11
   */
  multiplier?: number

  /*
   * Compatibility with possible existing field names.
   */
  minimum_quantity?: number
  min_quantity?: number
  min_order_quantity?: number
  minimum_order_quantity?: number

  has_cuts_selection?: boolean
  allowed_cuts?: string[]
  min_cuts_selection?: number
  max_cuts_selection?: number
}

interface OptionGroup {
  name: string
  is_required: boolean
  type?: 'radio' | 'checkbox'
  price_mode?: 'standalone' | 'addon'
  options: Option[]
}

interface SelectedOptionItem {
  groupName: string
  optionName: string
  priceModifier: number
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const productId = resolvedParams.id

  const router = useRouter()
  const { addItem } = useCart()
  const supabase = createClient()

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // -----------------------------------------------------------
  // PRODUCT QUANTITY
  // -----------------------------------------------------------

  const [quantity, setQuantity] = useState(1)

  const [validationError, setValidationError] =
    useState<string | null>(null)

  // Customization selection state
  const [selectedRadioOptions, setSelectedRadioOptions] =
    useState<Record<string, Option | null>>({})

  const [selectedCheckboxOptions, setSelectedCheckboxOptions] =
    useState<Record<string, boolean>>({})

  const [unitCounters, setUnitCounters] =
    useState<Record<string, number>>({})

  const [selectedCuts, setSelectedCuts] =
    useState<Record<string, string[]>>({})

  // ===========================================================
  // GENERIC NUMBER RESOLVER
  // ===========================================================

  const getPositiveNumber = (
    value: any
  ): number | null => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null
    }

    const parsed = Number(value)

    if (
      Number.isFinite(parsed) &&
      parsed >= 0
    ) {
      return Math.floor(parsed)
    }

    return null
  }

  // ===========================================================
  // GET OPTION MULTIPLIER
  //
  // THIS IS THE IMPORTANT FIX.
  //
  // If admin sets:
  //
  // multiplier = 5
  //
  // customer counter minimum = 6
  //
  // If multiplier = 10
  // customer counter minimum = 11
  // ===========================================================

  const getOptionMultiplier = (
    option: Option | null | undefined
  ): number => {
    if (!option) {
      return 0
    }

    const multiplierFields = [
      'multiplier',
      'minimum_quantity',
      'min_quantity',
      'min_order_quantity',
      'minimum_order_quantity',
    ]

    for (const field of multiplierFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          option,
          field
        )
      ) {
        const value =
          getPositiveNumber(
            (option as any)[field]
          )

        if (
          value !== null
        ) {
          return value
        }
      }
    }

    return 0
  }

  // ===========================================================
  // GET COUNTER MINIMUM
  //
  // multiplier 0  -> 1
  // multiplier 5  -> 6
  // multiplier 10 -> 11
  // ===========================================================

  const getCounterMinimum = (
    option: Option | null | undefined
  ): number => {
    const multiplier =
      getOptionMultiplier(option)

    return Math.max(
      1,
      multiplier + 1
    )
  }

  // ===========================================================
  // GET MINIMUM ORDER QUANTITY
  // ===========================================================

  const getMinimumOrderQuantity = (
    productData: any
  ): number => {
    if (!productData) {
      return 1
    }

    const enabledFields = [
      'minimum_quantity_enabled',
      'min_order_quantity_enabled',
      'enable_minimum_quantity',
      'enable_min_order_quantity',
      'has_minimum_quantity',
      'use_minimum_quantity',
      'enforce_minimum_quantity',
      'enforce_min_order_quantity',
      'minimum_order_quantity_enabled',
    ]

    let minimumQuantityEnabled:
      | boolean
      | null = null

    for (
      const field of enabledFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          productData,
          field
        )
      ) {
        const value =
          productData[field]

        if (
          typeof value ===
          'boolean'
        ) {
          minimumQuantityEnabled =
            value
          break
        }

        if (
          typeof value ===
          'string'
        ) {
          const normalized =
            value
              .trim()
              .toLowerCase()

          if (
            normalized ===
              'true' ||
            normalized === '1' ||
            normalized ===
              'yes' ||
            normalized ===
              'enabled'
          ) {
            minimumQuantityEnabled =
              true
            break
          }

          if (
            normalized ===
              'false' ||
            normalized === '0' ||
            normalized ===
              'no' ||
            normalized ===
              'disabled'
          ) {
            minimumQuantityEnabled =
              false
            break
          }
        }

        if (
          typeof value ===
          'number'
        ) {
          if (value === 1) {
            minimumQuantityEnabled =
              true
            break
          }

          if (value === 0) {
            minimumQuantityEnabled =
              false
            break
          }
        }
      }
    }

    if (
      minimumQuantityEnabled ===
      false
    ) {
      return 1
    }

    const minimumQuantityFields = [
      'min_order_quantity',
      'minimum_order_quantity',
      'minimum_quantity',
      'min_quantity',
      'min_qty',
    ]

    let configuredMinimum:
      | number
      | null = null

    for (
      const field of minimumQuantityFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          productData,
          field
        )
      ) {
        const rawValue =
          productData[field]

        const parsed =
          getPositiveNumber(
            rawValue
          )

        if (
          parsed !== null &&
          parsed >= 1
        ) {
          configuredMinimum =
            parsed
          break
        }
      }
    }

    if (
      configuredMinimum ===
        null ||
      configuredMinimum < 1
    ) {
      return 1
    }

    return configuredMinimum
  }

  // ===========================================================
  // CHECK PRODUCT MINIMUM ENABLED
  // ===========================================================

  const isMinimumQuantityEnabled = (
    productData: any
  ): boolean => {
    if (!productData) {
      return false
    }

    const enabledFields = [
      'minimum_quantity_enabled',
      'min_order_quantity_enabled',
      'enable_minimum_quantity',
      'enable_min_order_quantity',
      'has_minimum_quantity',
      'use_minimum_quantity',
      'enforce_minimum_quantity',
      'enforce_min_order_quantity',
      'minimum_order_quantity_enabled',
    ]

    for (
      const field of enabledFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          productData,
          field
        )
      ) {
        const value =
          productData[field]

        if (
          typeof value ===
          'boolean'
        ) {
          return value
        }

        if (
          typeof value ===
          'string'
        ) {
          const normalized =
            value
              .trim()
              .toLowerCase()

          if (
            normalized ===
              'true' ||
            normalized === '1' ||
            normalized ===
              'yes' ||
            normalized ===
              'enabled'
          ) {
            return true
          }

          if (
            normalized ===
              'false' ||
            normalized === '0' ||
            normalized ===
              'no' ||
            normalized ===
              'disabled'
          ) {
            return false
          }
        }

        if (
          typeof value ===
          'number'
        ) {
          return value === 1
        }
      }
    }

    const minimum =
      getMinimumOrderQuantity(
        productData
      )

    return minimum > 1
  }

  // ===========================================================
  // LOAD PRODUCT
  // ===========================================================

  useEffect(() => {
    if (productId) {
      loadProduct()
    }
  }, [productId])

  const loadProduct = async () => {
    try {
      setLoading(true)
      setValidationError(null)

      const { data, error } =
        await supabase
          .from('store_products')
          .select('*')
          .eq('id', productId)
          .single()

      if (error) {
        throw error
      }

      if (data) {
        setProduct(data)

        const minimumQuantity =
          getMinimumOrderQuantity(
            data
          )

        setQuantity(
          Math.max(
            1,
            minimumQuantity
          )
        )

        const defaults:
          Record<
            string,
            Option | null
          > = {}

        const counters:
          Record<
            string,
            number
          > = {}

        const cuts:
          Record<
            string,
            string[]
          > = {}

        if (
          Array.isArray(
            data.customization_options
          )
        ) {
          data.customization_options.forEach(
            (
              group: OptionGroup
            ) => {
              if (
                group.is_required ===
                  true &&
                (!group.type ||
                  group.type ===
                    'radio') &&
                Array.isArray(
                  group.options
                ) &&
                group.options.length >
                  0
              ) {
                const defaultOpt =
                  group.options[0]

                defaults[
                  group.name
                ] = defaultOpt

                // =============================================
                // IMPORTANT:
                // COUNTER NOW USES ADMIN MULTIPLIER
                // =============================================

                if (
                  defaultOpt.has_counter
                ) {
                  counters[
                    defaultOpt.name
                  ] =
                    getCounterMinimum(
                      defaultOpt
                    )
                }

                if (
                  defaultOpt.has_cuts_selection ===
                    true &&
                  Array.isArray(
                    defaultOpt.allowed_cuts
                  ) &&
                  defaultOpt
                    .allowed_cuts
                    .length > 0
                ) {
                  const minCount =
                    defaultOpt.min_cuts_selection ??
                    1

                  cuts[
                    defaultOpt.name
                  ] =
                    defaultOpt.allowed_cuts.slice(
                      0,
                      Math.max(
                        1,
                        minCount
                      )
                    )
                }
              } else {
                defaults[
                  group.name
                ] = null
              }
            }
          )
        }

        setSelectedRadioOptions(
          defaults
        )

        setSelectedCheckboxOptions(
          {}
        )

        setUnitCounters(
          counters
        )

        setSelectedCuts(cuts)
      }
    } catch (err) {
      console.error(
        'Error fetching product detail page:',
        err
      )
    } finally {
      setLoading(false)
    }
  }

  // ===========================================================
  // STANDALONE GROUP
  // ===========================================================

  const isStandaloneGroup = (
    group: OptionGroup
  ) => {
    if (
      group.price_mode ===
      'standalone'
    ) {
      return true
    }

    if (
      group.price_mode ===
      'addon'
    ) {
      return false
    }

    const gName =
      group.name.toLowerCase()

    return (
      gName.includes('portion') ||
      gName.includes('size') ||
      gName.includes('category') ||
      gName.includes('style') ||
      gName.includes('variant')
    )
  }

  // ===========================================================
  // RADIO SELECTION
  // ===========================================================

  const handleRadioClick = (
    group: OptionGroup,
    opt: Option
  ) => {
    setValidationError(null)

    const isCurrentlySelected =
      selectedRadioOptions[
        group.name
      ]?.name === opt.name

    if (
      isCurrentlySelected &&
      !group.is_required
    ) {
      const updated = {
        ...selectedRadioOptions,
      }

      updated[group.name] =
        null

      setSelectedRadioOptions(
        updated
      )

      const updatedCuts = {
        ...selectedCuts,
      }

      delete updatedCuts[
        opt.name
      ]

      setSelectedCuts(
        updatedCuts
      )

      return
    }

    setSelectedRadioOptions({
      ...selectedRadioOptions,
      [group.name]: opt,
    })

    // =============================================
    // IMPORTANT COUNTER FIX
    // =============================================

    if (opt.has_counter) {
      const counterMinimum =
        getCounterMinimum(opt)

      setUnitCounters({
        ...unitCounters,
        [opt.name]:
          Math.max(
            counterMinimum,
            unitCounters[
              opt.name
            ] || counterMinimum
          ),
      })
    }

    if (
      opt.has_cuts_selection ===
        true &&
      opt.allowed_cuts &&
      opt.allowed_cuts.length >
        0
    ) {
      if (
        !selectedCuts[
          opt.name
        ] ||
        selectedCuts[
          opt.name
        ].length === 0
      ) {
        const minCount =
          opt.min_cuts_selection ??
          1

        setSelectedCuts({
          ...selectedCuts,
          [opt.name]:
            opt.allowed_cuts.slice(
              0,
              Math.max(
                1,
                minCount
              )
            ),
        })
      }
    }
  }

  // ===========================================================
  // CUT SELECTION
  // ===========================================================

  const toggleCut = (
    optionName: string,
    cutName: string,
    maxSelect: number = 1
  ) => {
    setValidationError(null)

    const current =
      selectedCuts[
        optionName
      ] || []

    if (
      current.includes(cutName)
    ) {
      setSelectedCuts({
        ...selectedCuts,
        [optionName]:
          current.filter(
            (c) =>
              c !== cutName
          ),
      })

      return
    }

    if (maxSelect === 1) {
      setSelectedCuts({
        ...selectedCuts,
        [optionName]: [
          cutName,
        ],
      })

      return
    }

    if (
      current.length <
      maxSelect
    ) {
      setSelectedCuts({
        ...selectedCuts,
        [optionName]: [
          ...current,
          cutName,
        ],
      })
    } else {
      setSelectedCuts({
        ...selectedCuts,
        [optionName]: [
          ...current.slice(1),
          cutName,
        ],
      })
    }
  }

  // ===========================================================
  // COUNTER CHANGE
  // ===========================================================

  const handleCounterChange = (
    option: Option,
    change: number
  ) => {
    setValidationError(null)

    const minimum =
      getCounterMinimum(
        option
      )

    setUnitCounters(
      (currentCounters) => {
        const current =
          currentCounters[
            option.name
          ] || minimum

        const requested =
          current + change

        return {
          ...currentCounters,
          [option.name]:
            Math.max(
              minimum,
              requested
            ),
        }
      }
    )
  }

  // ===========================================================
  // PRODUCT QUANTITY CHANGE
  // ===========================================================

  const handleQuantityChange = (
    change: number
  ) => {
    if (!product) {
      return
    }

    const minimumQuantity =
      getMinimumOrderQuantity(
        product
      )

    setValidationError(null)

    setQuantity(
      (currentQuantity) => {
        const requestedQuantity =
          currentQuantity +
          change

        return Math.max(
          minimumQuantity,
          requestedQuantity
        )
      }
    )
  }

  // ===========================================================
  // CALCULATE TOTAL
  // ===========================================================

  const calculateTotal = () => {
    if (!product) {
      return 0
    }

    let base =
      Number(
        product.price
      ) || 0

    if (
      Array.isArray(
        product.customization_options
      )
    ) {
      product.customization_options.forEach(
        (
          group: OptionGroup
        ) => {
          if (
            !group.type ||
            group.type ===
              'radio'
          ) {
            const selectedOpt =
              selectedRadioOptions[
                group.name
              ]

            if (
              selectedOpt &&
              isStandaloneGroup(
                group
              )
            ) {
              if (
                selectedOpt.has_counter
              ) {
                const minimum =
                  getCounterMinimum(
                    selectedOpt
                  )

                const count =
                  Math.max(
                    minimum,
                    unitCounters[
                      selectedOpt.name
                    ] ||
                      minimum
                  )

                base =
                  (
                    selectedOpt.unit_price ||
                    selectedOpt.price_modifier ||
                    0
                  ) * count
              } else {
                base =
                  selectedOpt.price_modifier ||
                  0
              }
            }
          }
        }
      )

      product.customization_options.forEach(
        (
          group: OptionGroup
        ) => {
          if (
            !group.type ||
            group.type ===
              'radio'
          ) {
            const selectedOpt =
              selectedRadioOptions[
                group.name
              ]

            if (
              selectedOpt &&
              !isStandaloneGroup(
                group
              )
            ) {
              if (
                selectedOpt.has_counter
              ) {
                const minimum =
                  getCounterMinimum(
                    selectedOpt
                  )

                const count =
                  Math.max(
                    minimum,
                    unitCounters[
                      selectedOpt.name
                    ] ||
                      minimum
                  )

                base +=
                  (
                    selectedOpt.unit_price ||
                    selectedOpt.price_modifier ||
                    0
                  ) * count
              } else {
                base +=
                  selectedOpt.price_modifier ||
                  0
              }
            }
          }
        }
      )
    }

    if (
      Array.isArray(
        product.customization_options
      )
    ) {
      product.customization_options.forEach(
        (
          group: OptionGroup
        ) => {
          if (
            group.type ===
            'checkbox'
          ) {
            group.options.forEach(
              (opt) => {
                if (
                  selectedCheckboxOptions[
                    opt.name
                  ]
                ) {
                  base +=
                    opt.price_modifier ||
                    0
                }
              }
            )
          }
        }
      )
    }

    return (
      base * quantity
    )
  }

  // ===========================================================
  // ADD TO CART
  // ===========================================================

  const handleAddToCart = () => {
    if (!product) {
      return
    }

    const minimumQuantity =
      getMinimumOrderQuantity(
        product
      )

    if (
      quantity <
      minimumQuantity
    ) {
      setQuantity(
        minimumQuantity
      )

      setValidationError(
        `Minimum order quantity for this product is ${minimumQuantity}.`
      )

      return
    }

    const isOutOfStock =
      product.in_stock ===
        false ||
      product.is_available ===
        false

    if (isOutOfStock) {
      setValidationError(
        'This product is currently out of stock.'
      )

      return
    }

    // =========================================================
    // VALIDATE ALL COUNTER OPTIONS
    // =========================================================

    if (
      Array.isArray(
        product.customization_options
      )
    ) {
      for (
        const group of
          product.customization_options
      ) {
        if (
          !group.type ||
          group.type ===
            'radio'
        ) {
          const opt =
            selectedRadioOptions[
              group.name
            ]

          if (
            opt &&
            opt.has_counter
          ) {
            const minimum =
              getCounterMinimum(
                opt
              )

            const current =
              unitCounters[
                opt.name
              ] || 1

            if (
              current <
              minimum
            ) {
              setUnitCounters({
                ...unitCounters,
                [opt.name]:
                  minimum,
              })

              setValidationError(
                `${opt.name} must have at least ${minimum} units.`
              )

              return
            }
          }
        }
      }
    }

    // =========================================================
    // VALIDATE CUSTOMIZATION OPTIONS
    // =========================================================

    if (
      Array.isArray(
        product.customization_options
      )
    ) {
      for (
        const group of
          product.customization_options
      ) {
        if (
          group.is_required &&
          (!group.type ||
            group.type ===
              'radio')
        ) {
          const opt =
            selectedRadioOptions[
              group.name
            ]

          if (!opt) {
            setValidationError(
              `Please select an option for "${group.name}".`
            )

            return
          }
        }

        if (
          !group.type ||
          group.type ===
            'radio'
        ) {
          const opt =
            selectedRadioOptions[
              group.name
            ]

          if (
            opt &&
            opt.has_cuts_selection ===
              true
          ) {
            const minAllowed =
              opt.min_cuts_selection ??
              1

            const currentChosen =
              selectedCuts[
                opt.name
              ] || []

            if (
              currentChosen.length <
              minAllowed
            ) {
              setValidationError(
                `Please select at least ${minAllowed} piece cut${
                  minAllowed > 1
                    ? 's'
                    : ''
                } for "${opt.name}".`
              )

              return
            }
          }
        }
      }
    }

    // =========================================================
    // BUILD SELECTED OPTIONS
    // =========================================================

    const selectedOptionsList:
      SelectedOptionItem[] =
      []

    if (
      Array.isArray(
        product.customization_options
      )
    ) {
      product.customization_options.forEach(
        (
          group: OptionGroup
        ) => {
          if (
            !group.type ||
            group.type ===
              'radio'
          ) {
            const opt =
              selectedRadioOptions[
                group.name
              ]

            if (opt) {
              let modifier =
                opt.price_modifier ||
                0

              let optDisplayName =
                opt.name

              if (
                opt.has_counter
              ) {
                const minimum =
                  getCounterMinimum(
                    opt
                  )

                const count =
                  Math.max(
                    minimum,
                    unitCounters[
                      opt.name
                    ] ||
                      minimum
                  )

                modifier =
                  (
                    opt.unit_price ||
                    opt.price_modifier ||
                    0
                  ) * count

                optDisplayName =
                  `${opt.name} (${count} units)`

                // Include multiplier information
                // so the cart/order data is explicit.
                if (
                  getOptionMultiplier(
                    opt
                  ) > 0
                ) {
                  optDisplayName +=
                    ` [Min +${getOptionMultiplier(
                      opt
                    )}]`
                }
              }

              if (
                opt.has_cuts_selection ===
                  true &&
                selectedCuts[
                  opt.name
                ] &&
                selectedCuts[
                  opt.name
                ].length > 0
              ) {
                optDisplayName +=
                  ` [Parts: ${selectedCuts[
                    opt.name
                  ].join(', ')}]`
              }

              selectedOptionsList.push(
                {
                  groupName:
                    group.name,

                  optionName:
                    optDisplayName,

                  priceModifier:
                    modifier,
                }
              )
            }
          }
        }
      )
    }

    if (
      Array.isArray(
        product.customization_options
      )
    ) {
      product.customization_options.forEach(
        (
          group: OptionGroup
        ) => {
          if (
            group.type ===
            'checkbox'
          ) {
            group.options.forEach(
              (opt) => {
                if (
                  selectedCheckboxOptions[
                    opt.name
                  ]
                ) {
                  selectedOptionsList.push(
                    {
                      groupName:
                        group.name,

                      optionName:
                        opt.name,

                      priceModifier:
                        opt.price_modifier ||
                        0,
                    }
                  )
                }
              }
            )
          }
        }
      )
    }

    // =========================================================
    // CALCULATE UNIT PRICE
    // =========================================================

    const calculatedUnitPrice =
      calculateTotal() /
      quantity

    // =========================================================
    // ADD ITEM
    // =========================================================

    addItem({
      id: product.id,

      product_id:
        product.id,

      name:
        product.name,

      price:
        calculatedUnitPrice,

      quantity:
        quantity,

      imageUrl:
        product.image_url,

      selected_options:
        selectedOptionsList,

      product_name:
        product.name,

      unit_price:
        calculatedUnitPrice,

      final_price:
        calculatedUnitPrice,

      prep_time:
        undefined,

      cooking_time:
        undefined,

      fulfillment_time:
        undefined,
    })

    router.push('/cart')
  }

  // ===========================================================
  // LOADING
  // ===========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans">

        <StorefrontHeader />

        <div className="flex flex-col items-center justify-center py-32 space-y-3">

          <Loader2 className="w-8 h-8 animate-spin text-[#EAA823]" />

          <p className="text-xs font-bold text-gray-500">
            Preparing delicious meal details...
          </p>

        </div>

      </div>
    )
  }

  // ===========================================================
  // PRODUCT NOT FOUND
  // ===========================================================

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans">

        <StorefrontHeader />

        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">

          <h2 className="text-2xl font-black text-[#0A2E1D]">
            Meal not found
          </h2>

          <p className="text-sm text-gray-500">
            The product you are looking for is
            currently unavailable.
          </p>

          <Link href="/#our-menu-section">

            <Button className="bg-[#0A2E1D] text-white hover:bg-[#EAA823] hover:text-[#0A2E1D] font-bold rounded-full px-6 cursor-pointer">
              Browse Menu
            </Button>

          </Link>

        </div>

      </div>
    )
  }

  // ===========================================================
  // PRODUCT STATE
  // ===========================================================

  const isOutOfStock =
    product.in_stock ===
      false ||
    product.is_available ===
      false

  const minimumQuantity =
    getMinimumOrderQuantity(
      product
    )

  const minimumQuantityEnabled =
    isMinimumQuantityEnabled(
      product
    )

  // ===========================================================
  // RENDER
  // ===========================================================

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0A2E1D] font-sans pb-28">

      <StorefrontHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* BREADCRUMB */}

        <div className="mb-4 sm:mb-6">

          <Link
            href="/#our-menu-section"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0A2E1D] transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Link>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">

          {/* HERO IMAGE */}

          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24">

            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-[#072d1d] to-[#041a11] border-2 border-[#EAA823]/30 shadow-2xl group">

              {product.image_url ? (

                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  priority
                  className={`object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95 ${
                    isOutOfStock
                      ? 'grayscale opacity-60'
                      : ''
                  }`}
                />

              ) : (

                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
                  <Utensils className="w-16 h-16" />
                </div>

              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/40 pointer-events-none" />

              {isOutOfStock ? (

                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30">

                  <span className="bg-red-600 text-white font-black text-sm sm:text-base px-5 py-2.5 rounded-full uppercase shadow-xl tracking-wider flex items-center gap-2 border border-white/20">

                    <XCircle className="w-5 h-5" />

                    Currently Out of Stock

                  </span>

                </div>

              ) : (

                <div className="absolute top-3.5 left-3.5 z-20">

                  <span className="bg-[#EAA823] text-[#072d1d] font-black text-[10px] sm:text-xs px-3 py-1.5 rounded-full uppercase shadow-lg tracking-wider border border-white/20 flex items-center gap-1.5 backdrop-blur-md">

                    <Sparkles className="w-3 h-3 fill-current" />

                    {product.category ||
                      'Specialty'}

                  </span>

                </div>

              )}

              <div className="absolute top-3.5 right-3.5 z-20 flex items-center group/circle cursor-pointer">

                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#072d1d]/85 backdrop-blur-md border border-[#EAA823]/50 shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center transition-all duration-300 group-hover/circle:scale-110 active:scale-90">

                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">

                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />

                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white" />

                  </span>

                  <Truck className="w-4 h-4 text-[#EAA823] animate-bounce-slow" />

                  <span className="text-[7.5px] font-black text-emerald-100 uppercase tracking-tighter leading-none mt-0.5">
                    Woji
                  </span>

                </div>

              </div>

              <div className="absolute bottom-3.5 left-3.5 z-20 flex items-center group/circle cursor-pointer">

                <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#072d1d]/85 backdrop-blur-md border border-emerald-400/50 shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center transition-all duration-300 group-hover/circle:scale-110 active:scale-90">

                  <ShieldCheck className="w-4 h-4 text-emerald-400" />

                  <span className="text-[7.5px] font-black text-white uppercase tracking-tighter leading-tight mt-0.5">
                    100% Fresh
                  </span>

                </div>

              </div>

              <div className="absolute bottom-3.5 right-3.5 z-20 flex items-center group/circle cursor-pointer">

                <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#072d1d]/85 backdrop-blur-md border border-amber-400/50 shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center transition-all duration-300 group-hover/circle:scale-110 active:scale-90">

                  <Clock className="w-4 h-4 text-[#EAA823] animate-spin-slow" />

                  <span className="text-[8px] font-black text-amber-300 uppercase tracking-tighter leading-tight mt-0.5">
                    ~
                    {product.preparation_time_minutes ||
                      20}
                    m
                  </span>

                </div>

              </div>

            </div>

            <div className="flex items-center justify-between px-2 py-1.5 text-[11px] text-gray-500 font-semibold">

              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#EAA823]" />
                Live Express Kitchen
              </span>

              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Cooked Fresh to Order
              </span>

              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                {product.servings || 1}{' '}
                Serving
                {product.servings > 1
                  ? 's'
                  : ''}
              </span>

            </div>

          </div>

          {/* DETAILS */}

          <div className="lg:col-span-6 space-y-6">

            {/* HEADER */}

            <div className="space-y-2 pb-4 border-b border-gray-200">

              <div className="flex items-center justify-between gap-3">

                <h1 className="text-2xl sm:text-4xl font-black text-[#0A2E1D] leading-tight">
                  {product.name}
                </h1>

                {isOutOfStock && (
                  <span className="bg-red-100 text-red-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
                    Sold Out
                  </span>
                )}

              </div>

              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                {product.description ||
                  'Prepared fresh with premium ingredients from the De-echoi kitchen in Woji, Port Harcourt.'}
              </p>

              <div className="pt-2 flex items-center justify-between">

                <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">
                  Starting Price
                </span>

                <span className="text-2xl sm:text-3xl font-black text-[#0A2E1D]">
                  ₦
                  {Number(
                    product.price
                  ).toLocaleString()}
                </span>

              </div>

              {minimumQuantityEnabled &&
                minimumQuantity >
                  1 &&
                !isOutOfStock && (

                <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">

                  <ShoppingBag className="w-4 h-4 text-amber-600 flex-shrink-0" />

                  <div className="flex flex-col">

                    <span className="text-[11px] sm:text-xs font-black text-amber-800">
                      Minimum order quantity
                    </span>

                    <span className="text-[10px] sm:text-[11px] font-semibold text-amber-700">
                      You must order at least{' '}
                      {minimumQuantity}{' '}
                      units of this product.
                    </span>

                  </div>

                </div>

              )}

            </div>

            {/* ALERT */}

            {validationError && (

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 animate-in fade-in">

                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />

                <span className="font-semibold">
                  {validationError}
                </span>

              </div>

            )}

            {/* CUSTOMIZATION */}

            {!isOutOfStock &&
              Array.isArray(
                product.customization_options
              ) &&
              product.customization_options
                .length > 0 && (

                <div className="space-y-4">

                  {product.customization_options.map(
                    (
                      group: OptionGroup,
                      gIdx: number
                    ) => {

                      const isStandalone =
                        isStandaloneGroup(
                          group
                        )

                      const selectedGroupOpt =
                        selectedRadioOptions[
                          group.name
                        ]

                      return (

                        <div
                          key={gIdx}
                          className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3"
                        >

                          <div className="flex items-center justify-between">

                            <span className="text-xs font-bold text-[#0A2E1D] uppercase tracking-wider">
                              {group.name}:
                            </span>

                            {group.is_required ? (

                              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                Required
                              </span>

                            ) : (

                              <span className="text-[10px] text-gray-500 font-medium">
                                Optional (Click to unselect)
                              </span>

                            )}

                          </div>

                          {/* RADIO */}

                          {(!group.type ||
                            group.type ===
                              'radio') && (

                            <div className="space-y-3">

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                                {group.options.map(
                                  (
                                    opt: Option
                                  ) => {

                                    const isSelected =
                                      selectedRadioOptions[
                                        group.name
                                      ]?.name ===
                                      opt.name

                                    const counterMinimum =
                                      opt.has_counter
                                        ? getCounterMinimum(
                                            opt
                                          )
                                        : 1

                                    return (

                                      <button
                                        key={
                                          opt.name
                                        }
                                        type="button"
                                        onClick={() =>
                                          handleRadioClick(
                                            group,
                                            opt
                                          )
                                        }
                                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                          isSelected
                                            ? 'bg-[#0A2E1D] text-white border-[#0A2E1D] shadow-sm'
                                            : 'bg-[#FDFBF7] text-gray-700 border-gray-200 hover:border-gray-300'
                                        }`}
                                      >

                                        <div className="flex justify-between items-center w-full gap-2">

                                          <span className="text-xs font-bold flex items-center gap-1.5">

                                            {isSelected && (
                                              <span className="w-2 h-2 rounded-full bg-[#EAA823]" />
                                            )}

                                            {opt.name}

                                          </span>

                                          {opt.price_modifier >
                                            0 && (

                                            <span
                                              className={`text-[10px] font-black ${
                                                isSelected
                                                  ? 'text-[#EAA823]'
                                                  : 'text-[#0A2E1D]'
                                              }`}
                                            >
                                              {isStandalone
                                                ? `₦${opt.price_modifier.toLocaleString()}`
                                                : `+₦${opt.price_modifier.toLocaleString()}`}
                                            </span>

                                          )}

                                        </div>

                                        {opt.description && (

                                          <span
                                            className={`text-[10px] mt-1 block leading-tight ${
                                              isSelected
                                                ? 'text-gray-300'
                                                : 'text-gray-500'
                                            }`}
                                          >
                                            {
                                              opt.description
                                            }
                                          </span>

                                        )}

                                        {/* MULTIPLIER NOTICE */}

                                        {isSelected &&
                                          opt.has_counter &&
                                          getOptionMultiplier(
                                            opt
                                          ) >
                                            0 && (

                                          <span className="text-[9px] mt-2 font-black text-[#EAA823] uppercase">
                                            Starts at{' '}
                                            {
                                              counterMinimum
                                            }{' '}
                                            units
                                          </span>

                                        )}

                                      </button>

                                    )
                                  }
                                )}

                              </div>

                              {/* CUT SELECTION */}

                              {(() => {

                                const activeOpt =
                                  selectedRadioOptions[
                                    group.name
                                  ]

                                if (
                                  !activeOpt ||
                                  activeOpt.has_cuts_selection !==
                                    true ||
                                  !Array.isArray(
                                    activeOpt.allowed_cuts
                                  ) ||
                                  activeOpt
                                    .allowed_cuts
                                    .length ===
                                    0
                                ) {
                                  return null
                                }

                                const minSelect =
                                  activeOpt.min_cuts_selection ??
                                  1

                                const maxSelect =
                                  activeOpt.max_cuts_selection ||
                                  1

                                const currentChosen =
                                  selectedCuts[
                                    activeOpt.name
                                  ] || []

                                const meetsMin =
                                  currentChosen.length >=
                                  minSelect

                                return (

                                  <div className="bg-[#FDFBF7] p-3.5 rounded-xl border border-[#EAA823]/50 space-y-2.5 animate-in fade-in duration-200">

                                    <div className="flex items-center justify-between">

                                      <span className="text-xs font-bold text-[#0A2E1D] flex items-center gap-1.5">

                                        <Fish className="w-4 h-4 text-[#EAA823]" />

                                        Choose Preferred Cuts (
                                        {minSelect ===
                                        maxSelect
                                          ? `Pick ${minSelect}`
                                          : `Min ${minSelect}, Max ${maxSelect}`}
                                        ):

                                      </span>

                                      <span
                                        className={`text-[11px] font-mono font-bold ${
                                          meetsMin
                                            ? 'text-emerald-700'
                                            : 'text-amber-700 animate-pulse'
                                        }`}
                                      >
                                        {
                                          currentChosen.length
                                        }{' '}
                                        /{' '}
                                        {
                                          maxSelect
                                        }{' '}
                                        picked
                                      </span>

                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-0.5">

                                      {activeOpt.allowed_cuts.map(
                                        (
                                          cut
                                        ) => {

                                          const isCutSelected =
                                            currentChosen.includes(
                                              cut
                                            )

                                          return (

                                            <button
                                              key={
                                                cut
                                              }
                                              type="button"
                                              onClick={() =>
                                                toggleCut(
                                                  activeOpt.name,
                                                  cut,
                                                  maxSelect
                                                )
                                              }
                                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                                isCutSelected
                                                  ? 'bg-[#0A2E1D] text-[#EAA823] border border-[#0A2E1D] shadow-sm font-black scale-105'
                                                  : 'bg-white text-gray-700 border border-gray-300 hover:border-[#0A2E1D]'
                                              }`}
                                            >

                                              {isCutSelected && (
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                              )}

                                              <span>
                                                {cut}
                                              </span>

                                            </button>

                                          )
                                        }
                                      )}

                                    </div>

                                  </div>

                                )
                              })()}

                            </div>

                          )}

                          {/* =================================================
                              COUNTER
                          ================================================== */}

                          {selectedGroupOpt?.has_counter && (

                            (() => {

                              const currentOpt =
                                selectedGroupOpt

                              const multiplier =
                                getOptionMultiplier(
                                  currentOpt
                                )

                              const counterMinimum =
                                getCounterMinimum(
                                  currentOpt
                                )

                              const currentCount =
                                Math.max(
                                  counterMinimum,
                                  unitCounters[
                                    currentOpt
                                      .name
                                  ] ||
                                    counterMinimum
                                )

                              return (

                                <div className="flex items-center justify-between bg-[#FDFBF7] p-3 rounded-xl border border-gray-200 mt-2">

                                  <div>

                                    <span className="text-xs font-bold text-[#0A2E1D]">
                                      Quantity Count:
                                    </span>

                                    <span className="text-[10px] text-gray-500 block">
                                      ₦
                                      {(
                                        currentOpt.unit_price ||
                                        currentOpt.price_modifier ||
                                        2000
                                      ).toLocaleString()}{' '}
                                      per unit
                                    </span>

                                    {/* ADMIN MULTIPLIER */}

                                    {multiplier >
                                      0 && (

                                      <span className="text-[9px] text-amber-600 font-black block mt-1">
                                        Minimum: {counterMinimum}{' '}
                                        units
                                      </span>

                                    )}

                                  </div>

                                  <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">

                                    {/* MINUS */}

                                    <button
                                      type="button"
                                      disabled={
                                        currentCount <=
                                        counterMinimum
                                      }
                                      onClick={() =>
                                        handleCounterChange(
                                          currentOpt,
                                          -1
                                        )
                                      }
                                      className="p-1 hover:bg-gray-100 rounded text-gray-700 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                      aria-label="Decrease counter quantity"
                                    >

                                      <Minus className="w-3.5 h-3.5" />

                                    </button>

                                    {/* CURRENT */}

                                    <span className="font-bold text-xs w-8 text-center text-[#0A2E1D]">
                                      {
                                        currentCount
                                      }
                                    </span>

                                    {/* PLUS */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCounterChange(
                                          currentOpt,
                                          1
                                        )
                                      }
                                      className="p-1 hover:bg-gray-100 rounded text-gray-700 cursor-pointer"
                                      aria-label="Increase counter quantity"
                                    >

                                      <Plus className="w-3.5 h-3.5" />

                                    </button>

                                  </div>

                                </div>

                              )
                            })()

                          )}

                          {/* CHECKBOX */}

                          {group.type ===
                            'checkbox' && (

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                              {group.options.map(
                                (
                                  opt: Option
                                ) => {

                                  const isChecked =
                                    !!selectedCheckboxOptions[
                                      opt.name
                                    ]

                                  return (

                                    <button
                                      key={
                                        opt.name
                                      }
                                      type="button"
                                      onClick={() =>
                                        setSelectedCheckboxOptions(
                                          {
                                            ...selectedCheckboxOptions,
                                            [opt.name]:
                                              !isChecked,
                                          }
                                        )
                                      }
                                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                                        isChecked
                                          ? 'bg-[#0A2E1D] text-white border-[#0A2E1D] shadow-sm'
                                          : 'bg-[#FDFBF7] text-gray-700 border-gray-200 hover:border-gray-300'
                                      }`}
                                    >

                                      <div>

                                        <span className="text-xs font-bold block">
                                          {
                                            opt.name
                                          }
                                        </span>

                                        {opt.description && (

                                          <span
                                            className={`text-[10px] block ${
                                              isChecked
                                                ? 'text-gray-300'
                                                : 'text-gray-500'
                                            }`}
                                          >
                                            {
                                              opt.description
                                            }
                                          </span>

                                        )}

                                      </div>

                                      <span
                                        className={`text-[10px] font-black ${
                                          isChecked
                                            ? 'text-[#EAA823]'
                                            : 'text-[#0A2E1D]'
                                        }`}
                                      >
                                        +₦
                                        {Number(
                                          opt.price_modifier ||
                                            0
                                        ).toLocaleString()}
                                      </span>

                                    </button>

                                  )
                                }
                              )}

                            </div>

                          )}

                        </div>

                      )
                    }
                  )}

                </div>

              )}

            {/* INGREDIENTS */}

            {(
              (
                product.ingredients &&
                product.ingredients.length >
                  0
              ) ||
              (
                product.allergens &&
                product.allergens.length >
                  0
              )
            ) && (

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-3">

                {product.ingredients &&
                  product.ingredients
                    .length > 0 && (

                    <div>

                      <span className="text-xs font-bold text-[#0A2E1D] uppercase block mb-1">
                        Fresh Ingredients:
                      </span>

                      <p className="text-xs text-gray-600 leading-relaxed">
                        {product.ingredients.join(
                          ', '
                        )}
                      </p>

                    </div>

                  )}

                {product.allergens &&
                  product.allergens
                    .length > 0 && (

                    <div className="pt-2 border-t border-gray-100">

                      <span className="text-xs font-bold text-red-600 uppercase flex items-center gap-1 mb-1">

                        <ShieldAlert className="w-3.5 h-3.5" />

                        Allergen Information:

                      </span>

                      <p className="text-xs text-red-700 font-medium">
                        Contains:{' '}
                        {product.allergens.join(
                          ', '
                        )}
                      </p>

                    </div>

                  )}

              </div>

            )}

            {/* ADD TO CART */}

            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">

              {/* PRODUCT QUANTITY */}

              <div className="flex flex-col items-center gap-1">

                <div className="flex items-center gap-2 bg-[#FDFBF7] border border-gray-300 rounded-xl p-1">

                  <button
                    type="button"
                    disabled={
                      isOutOfStock ||
                      quantity <=
                        minimumQuantity
                    }
                    onClick={() =>
                      handleQuantityChange(
                        -1
                      )
                    }
                    className="p-2 rounded-lg hover:bg-white text-gray-700 cursor-pointer transition active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span className="font-black text-sm w-7 text-center text-[#0A2E1D]">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    disabled={
                      isOutOfStock
                    }
                    onClick={() =>
                      handleQuantityChange(
                        1
                      )
                    }
                    className="p-2 rounded-lg hover:bg-white text-gray-700 cursor-pointer transition active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                </div>

                {minimumQuantityEnabled &&
                  minimumQuantity >
                    1 && (

                  <span className="text-[8px] sm:text-[9px] font-black text-amber-600 uppercase tracking-wide whitespace-nowrap">
                    Minimum: {minimumQuantity}
                  </span>

                )}

              </div>

              {/* ADD BUTTON */}

              <Button
                onClick={
                  handleAddToCart
                }
                disabled={
                  isOutOfStock
                }
                className={`flex-1 font-black text-xs sm:text-sm py-6 rounded-xl shadow-md transition flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-[#0A2E1D] hover:bg-[#EAA823] hover:text-[#0A2E1D] text-white active:scale-95 cursor-pointer'
                }`}
              >

                {isOutOfStock ? (

                  <>
                    <XCircle className="w-4 h-4 text-red-500" />

                    <span>
                      Out of Stock
                    </span>
                  </>

                ) : (

                  <>
                    <ShoppingBag className="w-4 h-4" />

                    <span>
                      Add to Cart • ₦
                      {calculateTotal().toLocaleString()}
                    </span>
                  </>

                )}

              </Button>

            </div>

          </div>

        </div>

      </main>

      <style jsx global>{`

        @keyframes bounceSlow {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-2px);
          }
        }

        .animate-bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }

      `}</style>

    </div>
  )
}