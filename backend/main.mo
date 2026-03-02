import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Option "mo:core/Option";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Initialize the access control state at actor level
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Type definitions
  public type Gender = { #male; #female; #other };
  public type LivingSituation = { #withParents; #onCampus; #offCampus };
  public type IncomeSource = { #partTimeJob; #scholarship; #allowance; #other };
  public type BudgetDisciplineLevel = { #low; #medium; #high };
  public type ConflictFrequency = { #never; #rarely; #sometimes; #often };
  public type SpendingCategory = { #food; #transport; #education; #entertainment; #other };

  public type UserProfile = {
    name : Text;
    age : Nat;
    gender : Gender;
    course : Text;
    livingSituation : LivingSituation;
    incomeSource : IncomeSource;
    monthlyIncome : Float;
    tracksDailyExpenses : Bool;
    monthEndShortage : Bool;
    majorSpendingCategory : Text;
    borrowsDueToBudget : Bool;
    setsMonthlyBudget : Bool;
    budgetDisciplineLevel : BudgetDisciplineLevel;
    financialStressLevel : Nat;
    hasEmergencySavings : Bool;
    findsAppsUseful : Bool;
    previousAppName : ?Text;
    hasSharedExpenses : Bool;
    conflictFrequency : ConflictFrequency;
    prefersAutoSplit : Bool;
    featurePreferences : [Text];
    biggestFinancialProblem : Text;
  };

  public type Expense = {
    id : Nat;
    amount : Float;
    category : Text;
    date : Text;
    note : ?Text;
  };

  public type Budget = {
    category : Text;
    limit : Float;
  };

  public type SharedExpenseGroup = {
    id : Nat;
    name : Text;
    creator : Principal;
    members : [Principal];
  };

  public type SharedExpense = {
    id : Nat;
    groupId : Nat;
    description : Text;
    totalAmount : Float;
    paidBy : Principal;
    splitType : { #equal; #custom };
    customSplits : [(Principal, Float)];
    settlements : [(Principal, Bool)];
  };

  // State storage
  let userProfiles = Map.empty<Principal, UserProfile>();
  let userExpenses = Map.empty<Principal, [Expense]>();
  let userCustomCategories = Map.empty<Principal, [Text]>();
  let userBudgets = Map.empty<Principal, [Budget]>();
  let sharedGroups = Map.empty<Nat, SharedExpenseGroup>();
  let groupExpenses = Map.empty<Nat, [SharedExpense]>();

  var nextExpenseId : Nat = 0;
  var nextGroupId : Nat = 0;
  var nextSharedExpenseId : Nat = 0;

  let predefinedCategories : [Text] = ["Food", "Transport", "Books", "Entertainment", "Shopping", "Rent", "Miscellaneous"];

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Expense Management Functions
  public shared ({ caller }) func addExpense(amount : Float, category : Text, date : Text, note : ?Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };

    let expenseId = nextExpenseId;
    nextExpenseId += 1;

    let expense : Expense = {
      id = expenseId;
      amount = amount;
      category = category;
      date = date;
      note = note;
    };

    let currentExpenses = userExpenses.get(caller).get([]);
    let updatedExpenses = currentExpenses.concat([expense]);
    userExpenses.add(caller, updatedExpenses);

    expenseId;
  };

  public shared ({ caller }) func editExpense(id : Nat, amount : Float, category : Text, date : Text, note : ?Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can edit expenses");
    };

    let currentExpenses = userExpenses.get(caller).get([]);
    let updatedExpenses = currentExpenses.map(func(e) {
      if (e.id == id) {
        { id = e.id; amount = amount; category = category; date = date; note = note };
      } else {
        e;
      };
    });
    userExpenses.add(caller, updatedExpenses);
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete expenses");
    };

    let currentExpenses = userExpenses.get(caller).get([]);
    let updatedExpenses = currentExpenses.filter(func(e) { e.id != id });
    userExpenses.add(caller, updatedExpenses);
  };

  public query ({ caller }) func listExpenses(categoryFilter : ?Text, monthFilter : ?Text) : async [Expense] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can list expenses");
    };

    let expenses = userExpenses.get(caller).get([]);
    var filtered = expenses;

    switch (categoryFilter) {
      case (?cat) {
        filtered := filtered.filter(func(e) { e.category == cat });
      };
      case null {};
    };

    switch (monthFilter) {
      case (?month) {
        filtered := filtered.filter(func(e) {
          e.date.startsWith(#text month);
        });
      };
      case null {};
    };

    filtered.sort(
      func(a, b) {
        Text.compare(b.date, a.date);
      }
    );
  };

  // Custom Category Functions
  public shared ({ caller }) func addCustomCategory(name : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add custom categories");
    };

    let currentCategories = userCustomCategories.get(caller).get([]);
    let updatedCategories = currentCategories.concat([name]);
    userCustomCategories.add(caller, updatedCategories);
  };

  public query ({ caller }) func listCategories() : async [Text] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can list categories");
    };

    let customCategories = userCustomCategories.get(caller).get([]);
    predefinedCategories.concat(customCategories);
  };

  public shared ({ caller }) func deleteCustomCategory(name : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete custom categories");
    };

    let currentCategories = userCustomCategories.get(caller).get([]);
    let updatedCategories = currentCategories.filter(func(c) { c != name });
    userCustomCategories.add(caller, updatedCategories);
  };

  // Budget Management Functions
  public shared ({ caller }) func setMonthlyBudget(category : Text, amount : Float) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can set budgets");
    };

    let currentBudgets = userBudgets.get(caller).get([]);
    let filteredBudgets = currentBudgets.filter(func(b) { b.category != category });
    let newBudget : Budget = { category = category; limit = amount };
    let updatedBudgets = filteredBudgets.concat([newBudget]);
    userBudgets.add(caller, updatedBudgets);
  };

  public query ({ caller }) func getBudgetSummary(month : Text) : async {
    categories : [{ category : Text; limit : Float; totalSpent : Float; remaining : Float; percentageUsed : Float }];
    totalIncome : Float;
    totalExpenses : Float;
    incomeToExpenseRatio : Float;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view budget summary");
    };

    let budgets = userBudgets.get(caller).get([]);
    let expenses = userExpenses.get(caller).get([]);
    let monthExpenses = expenses.filter(func(e) {
      e.date.startsWith(#text month);
    });

    let profile = userProfiles.get(caller);
    let income = switch (profile) {
      case (?p) { p.monthlyIncome };
      case null { 0.0 };
    };

    var totalExpenses : Float = 0.0;
    for (e in monthExpenses.vals()) {
      totalExpenses += e.amount;
    };

    let categoryData = budgets.map(func(b) {
      var spent : Float = 0.0;
      for (e in monthExpenses.vals()) {
        if (e.category == b.category) {
          spent += e.amount;
        };
      };
      let remaining = b.limit - spent;
      let percentage = if (b.limit > 0.0) { (spent / b.limit) * 100.0 } else { 0.0 };
      {
        category = b.category;
        limit = b.limit;
        totalSpent = spent;
        remaining = remaining;
        percentageUsed = percentage;
      };
    });

    let ratio = if (totalExpenses > 0.0) { income / totalExpenses } else { 0.0 };

    {
      categories = categoryData;
      totalIncome = income;
      totalExpenses = totalExpenses;
      incomeToExpenseRatio = ratio;
    };
  };

  // Alerts Function
  public query ({ caller }) func getAlerts(month : Text) : async [{
    category : Text;
    alertType : { #warning; #critical; #exceeded };
    message : Text;
  }] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view alerts");
    };

    let budgets = userBudgets.get(caller).get([]);
    let expenses = userExpenses.get(caller).get([]);
    let monthExpenses = expenses.filter(func(e) {
      e.date.startsWith(#text month);
    });

    var alerts : [{ category : Text; alertType : { #warning; #critical; #exceeded }; message : Text }] = [];

    for (b in budgets.vals()) {
      var spent : Float = 0.0;
      for (e in monthExpenses.vals()) {
        if (e.category == b.category) {
          spent += e.amount;
        };
      };

      let percentage = if (b.limit > 0.0) { (spent / b.limit) * 100.0 } else { 0.0 };

      if (percentage >= 100.0) {
        alerts := alerts.concat([{
          category = b.category;
          alertType = #exceeded;
          message = "Budget exceeded for " # b.category # ". Consider reducing spending.";
        }]);
      } else if (percentage >= 90.0) {
        alerts := alerts.concat([{
          category = b.category;
          alertType = #critical;
          message = "Critical: " # b.category # " budget at " # percentage.toText() # "%. Immediate action needed.";
        }]);
      } else if (percentage >= 75.0) {
        alerts := alerts.concat([{
          category = b.category;
          alertType = #warning;
          message = "Warning: " # b.category # " budget at " # percentage.toText() # "%. Monitor spending closely.";
        }]);
      };
    };

    alerts;
  };

  // Financial Intelligence Function
  public query ({ caller }) func getFinancialScore() : async {
    financialScore : Float;
    disciplineLevel : Text;
    highestSpendingCategory : Text;
    monthlyTrend : [{ month : Text; total : Float }];
    borrowingRisk : Text;
    savingTips : [Text];
    weeklySpendingCap : Float;
    emergencyFundRecommendation : Float;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view financial score");
    };

    let profile = userProfiles.get(caller);
    let expenses = userExpenses.get(caller).get([]);
    let budgets = userBudgets.get(caller).get([]);

    var score : Float = 100.0;
    var disciplineLevel = "excellent";
    var borrowingRisk = "low";

    switch (profile) {
      case (?p) {
        if (not p.hasEmergencySavings) { score -= 20.0 };
        if (p.borrowsDueToBudget) {
          score -= 15.0;
          borrowingRisk := "high";
        };

        switch (p.budgetDisciplineLevel) {
          case (#low) { score -= 20.0; disciplineLevel := "poor" };
          case (#medium) { score -= 10.0; disciplineLevel := "fair" };
          case (#high) { disciplineLevel := "excellent" };
        };

        if (p.financialStressLevel > 3) { score -= 10.0 };
      };
      case null {};
    };

    var categorySpending = Map.empty<Text, Float>();
    for (e in expenses.vals()) {
      let current = categorySpending.get(e.category).get(0.0);
      categorySpending.add(e.category, current + e.amount);
    };

    var highestCategory = "None";
    var highestAmount : Float = 0.0;
    for ((cat, amount) in categorySpending.entries()) {
      if (amount > highestAmount) {
        highestAmount := amount;
        highestCategory := cat;
      };
    };

    let income = switch (profile) {
      case (?p) { p.monthlyIncome };
      case null { 0.0 };
    };

    let tips = [
      "Track all expenses daily to maintain awareness",
      "Build an emergency fund of 3-6 months expenses",
      "Review and adjust budgets monthly",
      "Reduce spending in highest category: " # highestCategory,
    ];

    let weeklySpendingCap = income / 4.0;
    let emergencyFund = income * 3.0;

    {
      financialScore = score;
      disciplineLevel = disciplineLevel;
      highestSpendingCategory = highestCategory;
      monthlyTrend = [];
      borrowingRisk = borrowingRisk;
      savingTips = tips;
      weeklySpendingCap = weeklySpendingCap;
      emergencyFundRecommendation = emergencyFund;
    };
  };

  // Shared Expense Group Functions
  public shared ({ caller }) func createGroup(name : Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create groups");
    };

    let groupId = nextGroupId;
    nextGroupId += 1;

    let group : SharedExpenseGroup = {
      id = groupId;
      name = name;
      creator = caller;
      members = [caller];
    };

    sharedGroups.add(groupId, group);
    groupId;
  };

  public shared ({ caller }) func deleteGroup(groupId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete groups");
    };

    switch (sharedGroups.get(groupId)) {
      case (?group) {
        if (group.creator != caller) {
          Runtime.trap("Unauthorized: Only group creator can delete the group");
        };
      };
      case null {
        Runtime.trap("Group not found");
      };
    };
  };

  public shared ({ caller }) func addGroupMember(groupId : Nat, member : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add members");
    };

    switch (sharedGroups.get(groupId)) {
      case (?group) {
        if (group.creator != caller) {
          Runtime.trap("Unauthorized: Only group creator can add members");
        };

        let updatedMembers = group.members.concat([member]);
        let updatedGroup = {
          id = group.id;
          name = group.name;
          creator = group.creator;
          members = updatedMembers;
        };
        sharedGroups.add(groupId, updatedGroup);
      };
      case null {
        Runtime.trap("Group not found");
      };
    };
  };

  public shared ({ caller }) func removeGroupMember(groupId : Nat, member : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can remove members");
    };

    switch (sharedGroups.get(groupId)) {
      case (?group) {
        if (group.creator != caller) {
          Runtime.trap("Unauthorized: Only group creator can remove members");
        };

        let updatedMembers = group.members.filter(func(m) { m != member });
        let updatedGroup = {
          id = group.id;
          name = group.name;
          creator = group.creator;
          members = updatedMembers;
        };
        sharedGroups.add(groupId, updatedGroup);
      };
      case null {
        Runtime.trap("Group not found");
      };
    };
  };

  public query ({ caller }) func listGroups() : async [SharedExpenseGroup] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can list groups");
    };

    var userGroups : [SharedExpenseGroup] = [];
    for ((id, group) in sharedGroups.entries()) {
      let isMember = group.members.find(func(m) { m == caller });
      switch (isMember) {
        case (?_) {
          userGroups := userGroups.concat([group]);
        };
        case null {};
      };
    };
    userGroups;
  };

  public shared ({ caller }) func addSharedExpense(
    groupId : Nat,
    description : Text,
    totalAmount : Float,
    paidBy : Principal,
    splitType : { #equal; #custom },
    customSplits : [(Principal, Float)]
  ) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add shared expenses");
    };

    switch (sharedGroups.get(groupId)) {
      case (?group) {
        let isMember = group.members.find(func(m) { m == caller });
        switch (isMember) {
          case null {
            Runtime.trap("Unauthorized: Only group members can add expenses");
          };
          case (?_) {};
        };

        let expenseId = nextSharedExpenseId;
        nextSharedExpenseId += 1;

        let settlements = group.members.map(func(m) {
          (m, m == paidBy);
        });

        let expense : SharedExpense = {
          id = expenseId;
          groupId = groupId;
          description = description;
          totalAmount = totalAmount;
          paidBy = paidBy;
          splitType = splitType;
          customSplits = customSplits;
          settlements = settlements;
        };

        let currentExpenses = groupExpenses.get(groupId).get([]);
        let updatedExpenses = currentExpenses.concat([expense]);
        groupExpenses.add(groupId, updatedExpenses);

        expenseId;
      };
      case null {
        Runtime.trap("Group not found");
      };
    };
  };

  public shared ({ caller }) func markSplitPaid(groupId : Nat, expenseId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can mark splits as paid");
    };

    switch (sharedGroups.get(groupId)) {
      case (?group) {
        let isMember = group.members.find(func(m) { m == caller });
        switch (isMember) {
          case null {
            Runtime.trap("Unauthorized: Only group members can mark splits as paid");
          };
          case (?_) {};
        };

        let expenses = groupExpenses.get(groupId).get([]);
        let updatedExpenses = expenses.map(func(e) {
          if (e.id == expenseId) {
            let updatedSettlements = e.settlements.map(func((p, paid)) {
              if (p == caller) { (p, true) } else { (p, paid) };
            });
            {
              id = e.id;
              groupId = e.groupId;
              description = e.description;
              totalAmount = e.totalAmount;
              paidBy = e.paidBy;
              splitType = e.splitType;
              customSplits = e.customSplits;
              settlements = updatedSettlements;
            };
          } else {
            e;
          };
        });
        groupExpenses.add(groupId, updatedExpenses);
      };
      case null {
        Runtime.trap("Group not found");
      };
    };
  };

  public query ({ caller }) func listSharedExpenses(groupId : Nat) : async [SharedExpense] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can list shared expenses");
    };

    switch (sharedGroups.get(groupId)) {
      case (?group) {
        let isMember = group.members.find(func(m) { m == caller });
        switch (isMember) {
          case null {
            Runtime.trap("Unauthorized: Only group members can view expenses");
          };
          case (?_) {};
        };

        groupExpenses.get(groupId).get([]);
      };
      case null {
        Runtime.trap("Group not found");
      };
    };
  };

  public query ({ caller }) func getSettlementSummary(groupId : Nat) : async [(Principal, Principal, Float)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view settlement summary");
    };

    switch (sharedGroups.get(groupId)) {
      case (?group) {
        let isMember = group.members.find(func(m) { m == caller });
        switch (isMember) {
          case null {
            Runtime.trap("Unauthorized: Only group members can view settlement summary");
          };
          case (?_) {};
        };

        var balances = Map.empty<Principal, Float>();
        for (m in group.members.vals()) {
          balances.add(m, 0.0);
        };

        let expenses = groupExpenses.get(groupId).get([]);
        for (e in expenses.vals()) {
          let paidByBalance = balances.get(e.paidBy).get(0.0);
          balances.add(e.paidBy, paidByBalance + e.totalAmount);

          switch (e.splitType) {
            case (#equal) {
              let splitAmount = e.totalAmount / customConvertIntToFloat(group.members.size());
              for (m in group.members.vals()) {
                if (m != e.paidBy) {
                  let memberBalance = balances.get(m).get(0.0);
                  balances.add(m, memberBalance - splitAmount);
                };
              };
            };
            case (#custom) {
              for ((member, amount) in e.customSplits.vals()) {
                if (member != e.paidBy) {
                  let memberBalance = balances.get(member).get(0.0);
                  balances.add(member, memberBalance - amount);
                };
              };
            };
          };
        };

        var settlements : [(Principal, Principal, Float)] = [];
        for ((debtor, balance) in balances.entries()) {
          if (balance < 0.0) {
            for ((creditor, creditorBalance) in balances.entries()) {
              if (creditorBalance > 0.0 and debtor != creditor) {
                settlements := settlements.concat([(debtor, creditor, Float.abs(balance))]);
              };
            };
          };
        };

        settlements;
      };
      case null {
        Runtime.trap("Group not found");
      };
    };
  };

  func customConvertIntToFloat(x : Int) : Float {
    if (x == 0) { return 0.0 };
    if (x == 1) { return 1.0 };
    if (x == 2) { return 2.0 };
    if (x == 3) { return 3.0 };
    if (x == 4) { return 4.0 };
    if (x == 5) { return 5.0 };
    if (x == 6) { return 6.0 };
    if (x == 7) { return 7.0 };
    if (x == 8) { return 8.0 };
    if (x == 9) { return 9.0 };
    if (x == 10) { return 10.0 };
    1.0;
  };
};
