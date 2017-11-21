define(() => ({
    MX: {
        marketClosed: "Market is Closed: Hours 9:30AM - 4:30PM EST",
        error: {
            query: "Seems like something's wrong on our end, sorry about that!",
            client: "Oh no, something broke! We'll try and fix this as soon as possible."
        }
    },
    admin: {
        sysClockOffset: "System clock offset",
        sysClockReset: "System clock reset to normal",

        joinedMp: mp => `MP changed to ${mp.name} (id: ${mp.id})`,
        resetMp: "MX Admin rejoined Staff MP",

        runGlobalMatching: "Running global matching...",

        regenCache: mpId => `Regenerating cache for MP ID ${mpId}...`,
        regenCacheDone: mpId => `Attribute caches regenerated for MPID: ${mpId}`,

        deletingInv: invId => `Deleting Inventory ID: ${invId}`,
        deletedInv: invId => `Inventory ID: ${invId} and related records have been deleted`,

        mpMsgBuilder: (mpId, messageSuffix) => `MP ID: ${mpId}${messageSuffix}`,
        mpDeleteSuffix: " and related data has been deleted",
        mpClearSuffix: "'s inventory and pricing data has been cleared",

        nukeConfirm: "Are you sure you want to wipe ALL user data?",
        nuke: "WIPING ALL USER DATA...",
        nukeComplete: "Database is kill",

        regenAttrDeps: "Regenerating Attribute Dependecies...",
        regenAttrDepsDone: "Attribute Dependecies Regenerated",

        error: {
            invId: "Please enter a valid inventory id number",
            invDelException: (invId, error) => `ERROR: Exception thrown trying to delete Inventory ID: ${invId} and related records: ${error}`
        }
    },
    status: {
        clearedTask: taskName => `Cleared ${taskName} executor tasks`
    },
    login: {
        incorrect: "Your password or username is incorrect. Please try again."
    },
    attrSel: {
        seeMore: "See More",
        hideExtra: "Hide Extra",
        dropdownRequired: "Select a value",
        dropdownDefault: "Any"
    },
    attrSlider: {
        valText: "Price Adjustment: "
    },
    attrType: {
        dropdownTypesText: "Choose an Attribute Type",
        dropdownCategoriesText: "Choose a Category",
        dropdownLabelsText: "Add a Label",
        dropdownParentsText: "Add a parent",
        dropdownChildrenText: "Add a child",
        error: {
            emptyName: "Name cannot be empty",
            saveDeps: dep => `Error saving [${dep.parent.name}/${dep.child.name}]`,
            delDeps: dep => `Error deleting [${dep.parent.name}/${dep.child.name}]`,
            saving: "Error saving AttributeType"
        }
    },
    attrTypeSel: {
        dropdownAny: "Any attribute type"
    },
    audSegVis: {
        notEnoughData: "Not enough data to visualize",
        notEnoughTypes: "Please select at least 2 attribute types",
        notEnoughDataAvailable: "Not enough data available for these types and date range"
    },
    camp: {
        saved: "Campaign saved",
        activated: "Campaign activated",
        deactivated: "Campaign deactivated",
        nosb: "There are currently no Smartbriefs in this campaign",
        dropdownTeamsText: "Choose a team",
        btnView: "View",
        submitSuccess: "Orders successfully submitted",
        ordersCanceled: "Orders canceled",
        cancelConfirm: "All orders in this campaign will be <b>canceled</b>. <br /> Are you sure you want to deactivate this campaign?",
        error: {
            emptyAdvertiser: "Advertiser cannot be empty",
            emptyBrand: "Brand cannot be empty",
            emptyBudget: "Budget cannot be negative or zero",
            emptyAgencyFee: "Agency fee cannot be empty",
            emptyName: "Name cannot be empty",
            noTeam: "Please assign this campaign a team",
            negAgencyFee: "Agency fee cannot be less than 0%",
            highAgencyFee: "Agency fee cannot be greater than 100%",
            negBudget: "Budget must be greater than 0",
            highBudget: "Budget is too high",
            nameConflict: "A campaign with this name already exists <br /> Please choose another name for your campaign",
            someOrdersNotSubmitted: "Can only submit Unsubmitted OrderGroups. Some selected OrderGroups were not submitted."

        }
    },
    catalogViewer: {
        noRecords: "There are no records available for the given criteria",
        noRecsSelected: "No Catalog Records selected"
    },
    dateRange: {
        error: {
            startBeforeToday: "Start date cannot be before today's date",
            endBeforeStart: "End date cannot be before start date",
            emptyStart: "No start date selected",
            emptyEnd: "No end date selected",
            invalidStart: "Invalid start date",
            invalidEnd: "Invalid end date"
        }
    },
    exclusion: {
        sliderText: "Amount reserved for static pricing: ",
        fixedPrice: (sliderVal) => (sliderVal * 100).toFixed(0) + "% Fixed price",
        variablePrice: (sliderVal) => ((1 - sliderVal) * 100).toFixed(0) + "% Variable price"
    },
    flightSlider: {
        sliderText: "Price Adjustment: "
    },
    flSliderScreen: {
        noSliders: "There are currently no flight sliders",
        alreadyExists: "Slider for that date/attribute combination already exists",
        noSource: "No source selected",
        dropdownText: "Choose a source",
        saved: "Sliders saved"
    },
    historyViewer: {
        noData: "There is no data for this date range"
    },
    import: {
        initiated: (type) => `${type} import initiated`,
        error: "There was a problem importing from the file",
        processing: "DFP data imported, now processing",
        dfpError: "There was a problem importing from DFP",
        dfpStarted: "Importing DFP data...",
        mpDropdownText: "Choose MP to write to",
        regenerating: "Regenerating..."
    },
    importReview: {
        taskDropdownText: "Choose task",
        taskPurged: (importDate) => `Task created on ${importDate} has been purged`,
        taskReady: (importDate) => `Task created on ${importDate} has been loaded for processing`
    },
    mappingOutTable: {
        empty: "This input maps to the empty set (i.e., a deletion)"
    },
    mappings: {
        mpDropdownText: "Select a MP"
    },
    mappingsTable: {
        empty: "No mappings for this MP"
    },
    market: {
        leave: "Leave",
        newTitle: "New Private Market",
        mpDropdownText: "Choose a MP",
        marketDropdownText: "Choose a market",
        nameRequired: "Market name required",
        created: "Market created",
        saved: "Market saved",
        deactivated: "Market deactivated"
    },
    marketManagement: {
        notCreator: "Not a creator of any private markets",
        notMember: "Not a member of any private markets"
    },
    mktManageControl: {
        mpDropdownText: "Choose a Participant",
        nameExists: "Market name already exists",
        noneSelected: "No market selected for deletion",
        saved: "Market changes saved"
    },
    marketViewerTable: {
        noOrdersFound: "No orders found matching your criteria"
    },
    matchSummary: {
        noMatches: "No unflighted matches to display."
    },
    metricEditor: {
        saved: "Metrics saved"
    },
    metricEditorIdx: {
        typeDropdownText: "Select a type"
    },
    mp: {
        saved: "Market Participant saved"
    },
    mpAdminsTable: {
        noAdmins: "No admins assigned to this MP"
    },
    mpBlacklistManager: {
        empty: "Blacklist is currently empty",
        mpDropdownText: "Choose a market participant",
        saved: "Blacklist saved"
    },
    mpManagementTable: {
        noMps: "There are currently no MPs"
    },
    mpProf: {
        userDropdownText: "Select a user",
        saved: "Profile saved",
        error: {
            mediaEmail: "Media email is invalid",
            mediaPhone: "Media phone is invalid",
            techEmail: "Tech email is invalid",
            techPhone: "Tech phone is invalid",
            website: "Website url is invalid"
        }
    },
    mpsTable: {
        noMps: "No participants"
    },
    networkDialog: {
        mpsDropdown: "Select counterparty",
        ordersSubmitted: "Orders submitted successfully",
        yesText: "SUBMIT"
    },
    og: {
        marketDropdownText: "Select a market",
        created: "Order Group created!",
        saved: "Order Group saved!",
        matched: "Matched!",
        savedToBook: "Saved to order book",
        error: {
            noAPARPrice: "No placement price entered",
            noASARPrice: "No audience price entered",
            noQuantity: "No quantity entered",
            noMarket: "No market selected",
            startBeforeToday: "Order Group cannot have a flight start date in the past",
            startSameToday: "Order Group cannot have a flight start date of today",
            endBeforeToday: "Order Group cannot have a flight end date in the past",
            endSameToday: "Order Group cannot have a flight end date of today",
            negQuantity: "Order amount must be greater than zero",
            negPrice: "Prices cannot be negative",
            zeroPrice: "Both prices cannot be zero",
            overBudget: (budget, group) => `Available budget is $${budget.toFixed(2)} and you asked for $${((group.aparPrice + group.asarPrice) * group.qty).toFixed(2)}`
        }
    },
    ogManager: {
        noOrders: "There are currently no orders placed in the market",
        canceled: "Orders canceled",
        noneSelected: "No orders selected"
    },
    placementVis: {
        firstAttrDropdown: "Select the first Attribute Type",
        secondAttrDropdown: "Select the second Attribute Type",
        error: {
            twoAttrs: "Please select two attributes"
        }
    },
    planVal: {
        noValsFound: "No valuations found"
    },
    portfolio: {
        noOrders: "No orders found",
        campDropdownText: "All"
    },
    pag: {
        adSizeDropdownText: "Choose an ad size",
        saved: "Pricing schedule saved",
        error: {
            invalidSettings: "Invalid graph slider settings",
            doesntExist: "Slider does not exist for type"
        }
    },
    pricingSimulator: {
        noSliders: "No Sliders for this selection",
        noPricing: "No Pricing for this selection",
        noRateCard: "No Rate Card for this selection",
        noGraph: "No Price Adjustment Graph for this selection",
        error: {
            future: "Datemust be in the future",
            invalidDate: "Date is invalid"
        },
        function: {
            rateCardPrice: dto =>
                `Price: $${parseFloat(dto.cardAPARPrice).toFixed(2)}(APAR),
                $${parseFloat(dto.cardASARPrice).toFixed(2)}(ASAR)`,
            rateCardKey: dto => `From Rate Card: ${dto.keyAttribute.value}`,
            unitTypeName: dto => `With row: ${dto.unitType}`,
            adSizeName: dto => `With adSize: ${dto.adSize.value}`,
            daysToFlight: dto => `Days to flight date, from today: ${dto.daysToFlight}`,
            pagPrice: dto =>
                `The Price Adjustment Graph overrides the base variable APAR price with:
                $${parseFloat(dto.graphAPARPrice).toFixed(2)}`,
            fixedPriceResult: dto =>
                `Final fixed price: $${parseFloat(dto.finalFixedAPARPrice).toFixed(2)}(APAR),
                $${parseFloat(dto.finalASARPrice).toFixed(2)}(ASAR)`,
            variablePriceResult: dto =>
                `Final variable price: $${parseFloat(dto.finalVariableAPARPrice).toFixed(2)}(APAR),
                $${parseFloat(dto.finalASARPrice).toFixed(2)}(ASAR)`
        }
    },
    privateMarketsTable: {
        noMarkets: "No private markets"
    },
    queryControl: {
        marketsDropdownText: "All",
        error: {
            invalidMinImp: "Invalid minimum impression count",
            emptyMediaType: "Please select a Media Type"
        }
    },
    rateCard: {
        saved: "Successfully Saved RateCard",
        deletedSections: "Sections successfully deleted",
        sectionDropdown: "Choose a section",
        dropdown: "Choose a Rate Card",
        editLayout: "EDIT LAYOUT",
        hideLayout: "HIDE LAYOUT EDITOR",
        error: {
            missingUA: "Main Table must have an Unbranded Audience row",
            missingPackage: "Unbranded Audience row must have a Package column",
            sectionMissingColumns: "Sections can't have a column that is not on the main body"
        }
    },
    rcViewer: {
        noRateCards: "You currently have no rate cards"
    },
    reportEditorIdx: {
        colsUpdated: "Report columns updated",
        reportUpdated: "Report updated",
        importInitiated: (name, created) => `Report ${name} ${created} import initiated`,
        error: {
            cols: response => `There was a problem updating the report columns: ${response}`,
            report: response => `There was a problem updating the report: ${response}`,
            import: response => `There was a problem importing from the file: ${response}`
        }
    },
    revMan: {
        noPAG: "No saved Price Adjustment Graphs",
        rcDropdownText: "Select a rate card",
        graphDropdownText: "Select a graph"
    },
    save: {
        enabled: "Save",
        processing: "Processing..."
    },
    sellDialog: {
        filteredCatRecs: "Catalog Records with all impressions already offered in this market have been filtered out",
        marketsDropdown: "Select a Market",
        ordersSubmitted: "Orders successfully submitted",
        zeroPrices: "Must have at least one non-zero price",
        unitsLessThanDays: "You cannot sell less than one unit per day",
        submitDisabled: "No selected records can be sold",
        recordUnavailable: "This record has no available impressions",
        yesText: "SUBMIT"
    },
    sellManager: {
        noOrdersPlaced: "You currently have no orders placed in the market",
        ordersCanceled: "Orders canceled",
        noOrdersSelected: "No orders selected",
        error: {
            canceling: "Error canceling orders"
        }
    },
    settingManager: {
        saveSuccess: "Seccessfully saved settings",
        noSettings: "There are no settings to edit"
    },
    sliderScreen: {
        noSliders: category => `There are currently no ${category} sliders`,
        saved: "Sliders saved",
        error: {
            noAttrs: "Slider must have attributes",
            attrConflict: "A slider with these attributes already exists",
            saving: "Error saving sliders"
        }
    },
    sbTable: {
        noBriefs: "This Campaign has no Smartbriefs"
    },
    team: {
        newHeaderTitle: "NEW TEAM",
        created: "Team created",
        teamHeaderTitle: "TEAM: ",
        teamDropdownText: "Select a Team",
        saved: "Team saved",
        error: {
            emptyName: "Team name cannot be empty"
        }
    },
    teamBuyingBl: {
        entryConflict: "Blacklist Entry already exists",
        emptyEntry: "Cannot add an empty Blacklist Entry",
        teamDropdownText: "Select a Team",
        saved: "Team Buying Blacklist saved",
        error: {
            save: "Error saving Team Buying Blacklist"
        }
    },
    teamManage: {
        noTeams: "There are no teams"
    },
    teamMembersTable: {
        roleDropdownText: "Select a role",
        noUsers: "No available users"
    },
    unitType: {
        childDropdownText: "Select a child",
        attrTypeDropdownText: "Select an Attribute Type",
        unitTypeDropdownText: "Select a Unit Type",
        newHeaderTitle: "New Unit Type",
        saved: "Unit Type saved",
        error: {
            emptyShortName: "Short Name cannot be empty",
            emptyLongName: "Long name cannot be empty",
            circRef: "A circular reference has been detected",
            multiParent: "A child has two parents, this is not allowed",
            renameUA: "Can't rename UA, saving children and Attribute Types"
        }
    },
    unitTypeGroup: {
        defaultTitle: "Default Unit Type Group:",
        attrTypeDDPrompt: "Choose an Attribute Type",
        unitTypeDDPrompt: "Choose a Unit Type",
        newTitle: isDefault =>
            `New ${isDefault
                ? "Default"
                : ""
            }Unit Type Group`,
        saved: "Unit Type Group Saved",
        error: {
            missingAttributeType: "Must select an Attribute Type"
        }
    },
    user: {
        saved: "User saved",
        roleDropdownText: "Select a Role",
        accountAdminMsg: "Account Administrator - All Permissions",
        notTeamMember: "Not a member of any teams",
        error: {
            usernameConflict: "Username already exists",
            emptyPass: "Please enter a password for this user",
            emptyUsername: "Please enter a username",
            invalidEmail: "Please enter a valid email",
            passwordMismatch: "Passwords do not match",
            emptyRole: "Please select a Role for this user"
        }
    },
    userManageTable: {
        noUsers: "There are no users"
    }
}));
